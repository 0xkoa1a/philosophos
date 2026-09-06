import http from "node:http"
import { readFile, stat } from "node:fs/promises"
import path from "node:path"
import { pathToFileURL } from "node:url"

/** Static files only: missing routes really return 404, with no SPA fallback. */
export function serveStatic({directory, port, base="/"}) {
  const root=path.resolve(directory)
  return http.createServer(async (request,response) => {
    try {
      const pathname=decodeURIComponent(new URL(request.url,"http://localhost").pathname)
      if(!pathname.startsWith(base)) {response.writeHead(404);response.end("Not found");return}
      const relative=pathname.slice(base.length)
      let file=path.resolve(root,relative)
      if(file!==root&&!file.startsWith(root+path.sep)) {response.writeHead(403);response.end();return}
      if((await stat(file)).isDirectory()) {
        if(!pathname.endsWith("/")) {response.writeHead(301,{Location:pathname+"/"});response.end();return}
        file=path.join(file,"index.html")
      }
      const types={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".svg":"image/svg+xml",".json":"application/json",".woff2":"font/woff2",".woff":"font/woff",".png":"image/png"}
      response.writeHead(200,{"Content-Type":types[path.extname(file)]??"application/octet-stream","Cache-Control":"no-store"})
      response.end(await readFile(file))
    } catch {response.writeHead(404);response.end("Not found")}
  }).listen(port,"127.0.0.1")
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  const [directory="_site",port="4173",base="/"]=process.argv.slice(2)
  serveStatic({directory,port:Number(port),base})
  console.log(`Static preview: http://127.0.0.1:${port}${base}`)
}
