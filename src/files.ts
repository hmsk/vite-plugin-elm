import { statSync } from 'fs'

export const isFile = (pathname: string) => statSync(pathname, { throwIfNoEntry: false })?.isFile() ?? false
