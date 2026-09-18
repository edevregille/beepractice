#!/usr/bin/env node
/**
 * Pre-renders every word, example sentence and letter name to a small audio
 * file using the macOS `say` voice, so the app never depends on the browser's
 * speech engine at run time.
 *
 *   node scripts/generate-audio.mjs           # only what is missing
 *   node scripts/generate-audio.mjs --force   # rebuild everything
 *
 * Requires macOS (`say` and `afconvert` are built in).
 */
import { execFile } from 'node:child_process'
import { mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const run = promisify(execFile)
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outRoot = join(root, 'public', 'audio')
const tmpRoot = join(root, 'node_modules', '.cache', 'beepractice-audio')

const VOICE = 'Samantha' // en_US — the words are American spellings
// Deliberately slower than the ~175 wpm default: these are read to children
// who are writing each letter down as they listen.
const RATE = { word: 145, sentence: 155, letter: 135 }
const BITRATE = 40000
const CONCURRENCY = 6
const force = process.argv.includes('--force')

/** Must match `audioSlug` in src/lib/audio.ts. */
function slug(word) {
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function loadWordLists() {
  await mkdir(tmpRoot, { recursive: true })
  const bundle = join(tmpRoot, 'words.mjs')
  await run('npx', ['esbuild', join(root, 'src/data/words.ts'), '--bundle', '--platform=node', '--format=esm', `--outfile=${bundle}`, '--log-level=error'], { cwd: root })
  return import(`file://${bundle}?t=${Date.now()}`)
}

async function render(text, outFile, rate) {
  if (!force && existsSync(outFile)) {
    const info = await stat(outFile)
    if (info.size > 0) return false
  }
  await mkdir(dirname(outFile), { recursive: true })
  const aiff = join(tmpRoot, `${Math.random().toString(36).slice(2)}.aiff`)
  try {
    await run('say', ['-v', VOICE, '-r', String(rate), '-o', aiff, '--', text])
    await run('afconvert', ['-f', 'm4af', '-d', 'aac', '-b', String(BITRATE), '-c', '1', aiff, outFile])
  } finally {
    await rm(aiff, { force: true })
  }
  return true
}

async function pool(jobs) {
  let made = 0
  let done = 0
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (jobs.length) {
      const job = jobs.pop()
      if (!job) break
      if (await job()) made += 1
      done += 1
      if (done % 25 === 0) process.stdout.write(`  ${done} done\n`)
    }
  })
  await Promise.all(workers)
  return made
}

const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('')

async function main() {
  if (process.platform !== 'darwin') {
    console.error('This script needs macOS (`say`). Generate the files on a Mac and commit public/audio.')
    process.exit(1)
  }

  const { GRADES, WORD_LISTS } = await loadWordLists()
  const jobs = []
  const manifest = {}

  for (const grade of GRADES) {
    manifest[grade] = []
    for (const entry of WORD_LISTS[grade]) {
      const name = slug(entry.word)
      manifest[grade].push(name)
      jobs.push(() => render(entry.word, join(outRoot, `g${grade}`, 'word', `${name}.m4a`), RATE.word))
      if (entry.sentence) {
        jobs.push(() => render(entry.sentence, join(outRoot, `g${grade}`, 'sentence', `${name}.m4a`), RATE.sentence))
      }
    }
  }
  for (const letter of LETTERS) {
    jobs.push(() => render(letter, join(outRoot, 'letters', `${letter}.m4a`), RATE.letter))
  }

  console.log(`Rendering ${jobs.length} clips with ${VOICE}...`)
  const made = await pool(jobs)

  await writeFile(join(outRoot, 'manifest.json'), JSON.stringify({ voice: VOICE, generated: new Date().toISOString(), grades: manifest }, null, 2))

  let bytes = 0
  const walk = async (dir) => {
    for (const item of await readdir(dir, { withFileTypes: true })) {
      const p = join(dir, item.name)
      if (item.isDirectory()) await walk(p)
      else bytes += (await stat(p)).size
    }
  }
  await walk(outRoot)
  console.log(`Done. ${made} new clip(s); ${(bytes / 1024 / 1024).toFixed(1)} MB total in public/audio.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
