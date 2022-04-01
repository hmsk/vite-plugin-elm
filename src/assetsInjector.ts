const ASSET_TAG = /'\[VITE_PLUGIN_ELM_ASSET:(?<path>.+?)\]'/g

const importNameFrom = (path: string) => {
  return path.replace(/[/.\-~@?]/g, '_')
}

const generateImports = (paths: string[]) => {
  return paths.map((path) => `import ${importNameFrom(path)} from '${path}'`).join('\n')
}

const assetsInjector = (compiledElmCode: string) => {
  const dynamicPaths: Record<string, string> = {}
  let matchedDynamic
  while ((matchedDynamic = ASSET_TAG.exec(compiledElmCode)) !== null) {
    if (matchedDynamic.groups?.path) {
      dynamicPaths[importNameFrom(matchedDynamic.groups.path)] = matchedDynamic.groups.path
    }
  }

  if (Object.keys(dynamicPaths).length > 0) {
    const imports = generateImports(Object.values(dynamicPaths))
    return `${imports}\n\n${compiledElmCode.replace(ASSET_TAG, (_, match) => importNameFrom(match))}`
  } else {
    return compiledElmCode
  }
}

export default assetsInjector
