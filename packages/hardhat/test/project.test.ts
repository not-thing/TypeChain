/* eslint-disable no-console */
/* eslint-disable no-invalid-this */
import { expect, Mock, mockFn } from 'earljs'
import { copyFileSync, existsSync, readFileSync } from 'fs'
import { readdir } from 'fs-extra'
import { join } from 'path'
import rimraf from 'rimraf'

import { useEnvironment } from './helpers'

describe('Typechain x Hardhat', function () {
  this.timeout(120_000)
  useEnvironment('hardhat-project')
  let originalCwd: typeof process.cwd

  beforeEach(async function () {
    originalCwd = process.cwd
    await this.hre.run('clean')
    rimraf.sync(TestContract2DestinationPath)
  })

  this.afterEach(() => {
    process.cwd = originalCwd
  })

  it('compiles and generates typings', async function () {
    const exists = existsSync(this.hre.config.typechain.outDir)
    expect(exists).toEqual(false)

    await this.hre.run('compile')

    const dir = await readdir(this.hre.config.typechain.outDir)
    expect(dir.length).not.toEqual(0)
  })

  it('compiles and generates typings when not in root directory', async function () {
    const exists = existsSync(this.hre.config.typechain.outDir)
    expect(exists).toEqual(false)

    const oldCwd = process.cwd()
    // force change cwd to not-existing dir
    // cwd should not be used to determine output dir path
    process.cwd = () => join(oldCwd, 'src')

    await this.hre.run('compile')

    // fsPromises.readdir uses process.cwd on Windows
    process.cwd = originalCwd

    const dir = await readdir(this.hre.config.typechain.outDir)
    expect(dir.length).not.toEqual(0)
  })

  it('doesnt generate typings with --no-typechain ', async function () {
    const exists = existsSync(this.hre.config.typechain.outDir)
    expect(exists).toEqual(false)

    await this.hre.run('compile', { noTypechain: true })

    expect(existsSync(this.hre.config.typechain.outDir)).toEqual(false)
  })

  describe('when recompiling', () => {
    let originalConsoleLog: any
    let consoleLogMock: Mock<any, any>

    beforeEach(() => {
      consoleLogMock = mockFn().returns(undefined)
      originalConsoleLog = console.log
      console.log = consoleLogMock
    })

    afterEach(() => {
      console.log = originalConsoleLog
    })

    it('generates typings only for changed files', async function () {
      const exists = existsSync(this.hre.config.typechain.outDir)
      expect(exists).toEqual(false)

      await this.hre.run('compile')
      expect(consoleLogMock).toHaveBeenCalledWith([expect.stringMatching(/Successfully generated \d\d\d? typings!/)])

      // copy one more file and recompile project
      copyFileSync(TestContract2OriginPath, TestContract2DestinationPath)
      await this.hre.run('compile')

      expect(existsSync(this.hre.config.typechain.outDir)).toEqual(true)
      expect(readFileSync(typechainIndexFilePath, 'utf-8')).toMatchSnapshot()
      expect(consoleLogMock).toHaveBeenCalledWith(['Successfully generated 8 typings!'])
    })

    it('does nothing when there are no changes to recompile', async function () {
      const exists = existsSync(this.hre.config.typechain.outDir)
      expect(exists).toEqual(false)

      await this.hre.run('compile')
      expect(consoleLogMock).toHaveBeenCalledWith([expect.stringMatching(/Successfully generated \d\d\d? typings!/)])

      await this.hre.run('compile')

      expect(existsSync(this.hre.config.typechain.outDir)).toEqual(true)
      expect(consoleLogMock).toHaveBeenCalledWith(['No need to generate any newer typings.'])
    })

    it('does full recompile when forced', async function () {
      const exists = existsSync(this.hre.config.typechain.outDir)
      expect(exists).toEqual(false)

      await this.hre.run('compile')
      expect(consoleLogMock).toHaveBeenCalledWith(['Successfully generated 14 typings!'])

      await this.hre.run('typechain')

      expect(existsSync(this.hre.config.typechain.outDir)).toEqual(true)
      expect(consoleLogMock).toHaveBeenCalledWith(['Successfully generated 14 typings!'])
    })

    it('generates typing for external artifacts', async function () {
      const exists = existsSync(this.hre.config.typechain.outDir)
      expect(exists).toEqual(false)

      this.hre.config.typechain.externalArtifacts = ['externalArtifacts/*.json']

      await this.hre.run('compile')
      expect(consoleLogMock).toHaveBeenCalledWith(['Successfully generated 14 typings for external artifacts!'])

      await this.hre.run('compile')
      expect(consoleLogMock).toHaveBeenCalledWith(['Successfully generated 14 typings for external artifacts!'])
    })
  })

  describe('when setting custom artifact glob', () => {
    let oldArtifactGlob: string[] | undefined
    beforeEach(function () {
      oldArtifactGlob = this.hre.config.typechain.artifacts
    })
    afterEach(function () {
      this.hre.config.typechain.artifacts = oldArtifactGlob
    })
    ;[true, false].forEach((forcedCompilation) => {
      describe(`when type generation is ${forcedCompilation ? '' : 'not'} forced`, () => {
        let subject: () => Promise<void>
        beforeEach(async function () {
          if (forcedCompilation) {
            await this.hre.run('compile', { noTypechain: true })
          }
          subject = () => {
            if (forcedCompilation) {
              return this.hre.run('typechain')
            } else {
              return this.hre.run('compile')
            }
          }
        })

        describe('when glob matches some files', () => {
          beforeEach(function () {
            this.hre.config.typechain.artifacts = ['**/EdgeCases.json']
          })

          it('includes build artifacts that match the glob', async function () {
            const exists = existsSync(this.hre.config.typechain.outDir)
            expect(exists).toEqual(false)

            await subject()

            const dir = await readdir(this.hre.config.typechain.outDir)
            expect(dir.includes('EdgeCases.ts')).toEqual(true)
          })

          it('excludes build artifacts that do not match the glob', async function () {
            const exists = existsSync(this.hre.config.typechain.outDir)
            expect(exists).toEqual(false)

            await subject()

            const dir = await readdir(this.hre.config.typechain.outDir)
            expect(dir.includes('TestContract.ts')).toEqual(false)
            expect(dir.includes('TestContract1.ts')).toEqual(false)
          })
        })
        describe('when glob matches no files', () => {
          beforeEach(function () {
            this.hre.config.typechain.artifacts = ['**/THISDOESNTMATCHANYTHING.json']
          })

          describe('when no external artifacts are specified', () => {
            it('does not generate any types', async function () {
              const exists = existsSync(this.hre.config.typechain.outDir)
              expect(exists).toEqual(false)

              await subject()
              expect(existsSync(this.hre.config.typechain.outDir)).toEqual(false)
            })
          })

          describe('when external artifacts are specified', () => {
            it('only generates types for external artifacts', async function () {
              const exists = existsSync(this.hre.config.typechain.outDir)
              expect(exists).toEqual(false)

              this.hre.config.typechain.externalArtifacts = ['externalArtifacts/*.json']
              await subject()
              expect(existsSync(this.hre.config.typechain.outDir)).toEqual(true)
            })
          })
        })
      })
    })
  })
})

describe('dontOverrideCompile', function () {
  useEnvironment('no-override-project')
  let originalCwd: typeof process.cwd

  beforeEach(async function () {
    originalCwd = process.cwd
    await this.hre.run('clean')
  })

  this.afterEach(() => {
    process.cwd = originalCwd
  })

  it('should desible typechain for the compile task', async function () {
    const exists = existsSync(this.hre.config.typechain.outDir)
    expect(exists).toEqual(false)

    await this.hre.run('compile')

    const existsAfter = existsSync(this.hre.config.typechain.outDir)
    expect(existsAfter).toEqual(false)
  })
})

const contractDir = join(__dirname, 'fixture-projects/hardhat-project/contracts')
const fixtureFilesDir = join(__dirname, 'fixture-files')
const TestContract2OriginPath = join(fixtureFilesDir, 'TestContract2.sol')
const TestContract2DestinationPath = join(contractDir, 'TestContract2.sol')
const typechainIndexFilePath = join(__dirname, 'fixture-projects/hardhat-project/typechain-types/index.ts')
