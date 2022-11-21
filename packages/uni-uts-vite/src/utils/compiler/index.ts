import { runKotlinProd, runKotlinDev } from './kotlin'
import { runSwiftProd, runSwiftDev } from './swift'
export { genProxyCode } from './code'
export function getCompiler(type: 'kotlin' | 'swift') {
  if (type === 'swift') {
    return {
      runProd: runSwiftProd,
      runDev: runSwiftDev,
    }
  }
  return {
    runProd: runKotlinProd,
    runDev: runKotlinDev,
  }
}
