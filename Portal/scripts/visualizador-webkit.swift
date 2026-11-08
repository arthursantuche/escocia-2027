// Visualizador em WebKit, o motor do Safari, para quando não há simulador de iPhone. Abre a página
// no tamanho dado, rola, tira capturas e devolve o resultado de um JavaScript. Não desenha
// backdrop-filter nas capturas nem emula a área segura.
// Compilar: swiftc -O scripts/visualizador-webkit.swift -o /tmp/wk
// Uso: /tmp/wk URL largura altura escuro(0|1) prefixo-das-capturas "y1,y2,..." [js-final] [js-inicial]
// y negativo rola a partir da posição atual.
import Cocoa
import WebKit
let a = CommandLine.arguments
let url = URL(string: a[1])!, W = CGFloat(Double(a[2])!), H = CGFloat(Double(a[3])!), dark = a[4] == "1", pref = a[5]
let ys = a[6].split(separator: ",").map { Double($0)! }
let js = a.count > 7 ? a[7] : "1"
let pre = a.count > 8 ? a[8] : "1"
let app = NSApplication.shared; app.setActivationPolicy(.accessory)
if dark { app.appearance = NSAppearance(named: .darkAqua) } else { app.appearance = NSAppearance(named: .aqua) }
let cfg = WKWebViewConfiguration()
let win = NSWindow(contentRect: NSRect(x: 0, y: 0, width: W, height: H), styleMask: [.borderless], backing: .buffered, defer: false)
let web = WKWebView(frame: NSRect(x: 0, y: 0, width: W, height: H), configuration: cfg)
web.customUserAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"
win.contentView = web; win.isOpaque = true; win.level = .init(-1000); win.orderFront(nil)
web.load(URLRequest(url: url))
func passo(_ i: Int) {
  if i >= ys.count {
    web.evaluateJavaScript(js) { r, e in print("js:", r ?? "nil", e ?? ""); exit(0) }
    return
  }
  web.evaluateJavaScript(ys[i] < 0 ? "window.scrollBy({top:\(-ys[i]),behavior:'instant'});1" : "window.scrollTo({top:\(ys[i]),behavior:'instant'});1") { _, _ in
    DispatchQueue.main.asyncAfter(deadline: .now() + 1.3) {
      web.takeSnapshot(with: nil) { img, _ in
        if let t = img?.tiffRepresentation, let b = NSBitmapImageRep(data: t), let p = b.representation(using: .png, properties: [:]) {
          try? p.write(to: URL(fileURLWithPath: "\(pref)\(i).png"))
        }
        passo(i + 1)
      }
    }
  }
}
DispatchQueue.main.asyncAfter(deadline: .now() + 3.5) { web.evaluateJavaScript(pre) { _, _ in passo(0) } }
DispatchQueue.main.asyncAfter(deadline: .now() + 60) { print("tempo"); exit(1) }
app.run()
