const fs = require('fs')
const path = require('path')
const { parse, bundle, UtsTarget } = require('../packages/uts/dist')
const projectDir = path.resolve(__dirname, '../packages/playground/uts')

const outDir = path.resolve(projectDir, 'unpackage/dist/dev/app-plus')
const sourceMap = path.resolve(projectDir, 'unpackage/dist/dev/.sourcemap/app')

const start = Date.now()
parse(
  fs.readFileSync(
    path.resolve(
      projectDir,
      'uni_modules/test-uniplugin/utssdk/app-android/index.uts'
    ),
    'utf8'
  )
).then((res) => {
  console.log('parse: ' + (Date.now() - start) + 'ms')
  console.log(JSON.stringify(res))
})
async function testKotlin() {
  const start = Date.now()
  await bundle(UtsTarget.KOTLIN, {
    input: {
      root: projectDir,
      filename: path.resolve(
        projectDir,
        'uni_modules/test-uniplugin/utssdk/app-android/index.uts'
      ),
    },
    output: {
      outDir,
      package: 'uts.modules.modules.testUniPlugin',
      imports: [
        'kotlinx.coroutines.async',
        'kotlinx.coroutines.CoroutineScope',
        'kotlinx.coroutines.Deferred',
        'kotlinx.coroutines.Dispatchers',
        'io.dcloud.uts.*',
      ],
      sourceMap,
      extname: 'kt',
      logFilename: true,
      isPlugin: true,
    },
  }).then((res) => {
    console.log('bundle: ' + (Date.now() - start) + 'ms')
    console.log(JSON.stringify(res))
    console.log(
      fs.readFileSync(
        path.resolve(
          projectDir,
          'unpackage/dist/dev/app-plus/uni_modules/test-uniplugin/utssdk/app-android/index.kt'
        ),
        'utf8'
      )
    )
  })
  await bundle(UtsTarget.KOTLIN, {
    input: {
      root: projectDir,
      filename: path.resolve(
        projectDir,
        'utssdk/test-uts/app-android/index.uts'
      ),
    },
    output: {
      outDir,
      package: 'uts.sdk.testUts',
      imports: [
        'kotlinx.coroutines.async',
        'kotlinx.coroutines.CoroutineScope',
        'kotlinx.coroutines.Deferred',
        'kotlinx.coroutines.Dispatchers',
        'io.dcloud.uts.*',
      ],
      sourceMap,
      extname: 'kt',
      logFilename: true,
      isPlugin: true,
    },
  })
}

async function testSwift() {
  const start = Date.now()
  await bundle(UtsTarget.SWIFT, {
    input: {
      root: projectDir,
      filename: path.resolve(
        projectDir,
        'uni_modules/test-uniplugin/utssdk/app-ios/index.uts'
      ),
    },
    output: {
      outDir,
      package: 'UTSSDKModulesTestUniPlugin',
      imports: ['DCloudUTSPlugin'],
      sourceMap,
      extname: 'swift',
      logFilename: true,
      isPlugin: true,
    },
  }).then((res) => {
    console.log('bundle: ' + (Date.now() - start) + 'ms')
    console.log(JSON.stringify(res))
    console.log(
      fs.readFileSync(
        path.resolve(
          projectDir,
          'unpackage/dist/dev/app-plus/uni_modules/test-uniplugin/utssdk/app-ios/index.swift'
        ),
        'utf8'
      )
    )
  })
  await bundle(UtsTarget.SWIFT, {
    input: {
      root: projectDir,
      filename: path.resolve(
        projectDir,
        'utssdk/test-uts/app-ios/index.uts'
      ),
    },
    output: {
      outDir,
      package: 'UTSSDKModulesTestUts',
      imports: ['DCUTSPlugin'],
      sourceMap,
      extname: 'swift',
      logFilename: true,
      isPlugin: true,
    },
  })
}

async function test() {
  await testKotlin()
  await testSwift()
}

test()
