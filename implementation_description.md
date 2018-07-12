# Arboretum Implementation
Arboretum's implementation is split into three parts:

- **Browser** code that is responsible for displaying a browser to the end user
- **Server-side** code that is responsible for serving a clone of the browser's content to remote clients
- **Client-side** code that remote clients connect to

The primary entry point is 'src/main.ts', which creates a Browser instance and contains functionality to start an Arboretum server.

## Browser Code
The browser code is implemented using the [Electron](https://electronjs.org/) framework. Its code is in the 'src/browser' directory.

Its implementation includes code defining the "chrome" of Arboretum: the navigation bar, tabs, etc. It is implemented using:
- [React](https://reactjs.org/) for interactivity
- [Photon](http://photonkit.com/) and [BootStrap](https://getbootstrap.com/) for visual style
- Electron's [`BrowserWindow`](https://github.com/electron/electron/blob/master/docs/api/browser-window.md) class as the actual browser

## Server-Side Code
The "server-side" implementation deals with tracking and serving remote clients with information about the state of the contents of the Browser (more specifically, the `BrowserWindow` instances inside of the Browser). The server-side communicates with `BrowswerWindow` instances through the [Chrome DevTools protocol](https://chromedevtools.github.io/devtools-protocol/).

The server-side code does the following:
- **Tracks the complete DOM** tree of every `BrowserWindow` instance
- **Tracks resources** (images, external stylesheets, etc) referenced in those DOM trees
- **Transforms references to those resources** to not be dependent on external resources (for example, if a web page loads 'http://umich.edu/logo.png', it will store the 'logo.png' image internally and replace references from the 'umich.edu' domain to instead point to the local host)
- **Simulate user input events** like clicks and keypresses for the BrowserWindow instance

### Server-Side DOM Tracking
DOM tracking is done in layers:
- **Browser** tracking (src/server/BrowserState.ts) tracks the entire browser to look for tabs being created and destroyed
- **Tab** tracking (src/server/TabState.ts) looks for navigation within a particular tab. Specifically, it looks for when a new root frame is created
- **Frame** tracking (src/server/FrameState.ts) tracks the contents of a frame (there's a root frame for the page and there might be any number of nested `iframe`s or `frame`s)
- **DOM** tracking (src/server/DOMState.ts) tracks the state of a specific DOM node, its attributes, and children

The end result is that all four of these layers create a large JSON object representing the complete DOM tree for every tab in the browser. This JSON object is then shared through [ShareDB](https://github.com/share/sharedb).

By default, JavaScript code (both inline code and code in `<script/>` tags) is eliminated from the cloned DOM tree.

### Server-Side Resource Tracking
The server-side code maintains a list of resources (outside of the large JSON object storing the DOM tree). It fetches resources on client request using the Chrome DevTools protocol.

### Server-Side Resource Transformation
Resources that references external domains are translated in order to instead reference the local server. For example:

```html
<image src='http://umich.edu/logo.png'>
```
and
```html
<span style='background-image: url("http://umich.edu/logo.png")'>
```
and
```css
.header {
    background-image: url('/logo.png');
}
```

Would get translated to instead reference the local host:
```html
<image src='r?l=http%3A%2F%2Fumich.edu%2Flogo.png&f=3127&t=206f3fc5-ca3f-47b0-903c-090e0b93d476>
```
The URL parameters here are:
- `l`: The original location of the resource
- `f`: The frame ID (to help Arboretum know where to look for the resource)
- `t`: The tab ID (again, to help Arboretum know where to look for the resource)

'src/server/css_parser.ts' and 'src/server/url_transform.ts' have most of the functionality to do these transformations.

### Server-Side Input Event Simulation
Most of the communication so far has discussed information being sent from the `BrowserWindow` instance to the server-side code that tracks and transforms the incoming data. However, the server-side code can also simulate input events from users (clicks, keyboard presses, etc). It does this by injecting small JavaScript snippets into the `BrowserWindow`.

The code for simulating input events is in 'src/server/hack_driver.ts', which references scripts in 'src/server/injectable_js'.

### A note about more server-side functionality
The server-side code also tracks the contents of `<canvas/>` elements by injecting JavaScript code that exports the binary contents of a canvas and sends them to clients. The code for this is in 'src/server/hack_driver.ts'.

# Client Code
The client code is responsible for displaying the contents of the end user's browser to remote clients. It is implemented using:
- [React](https://reactjs.org/) for interactivity
- [Photon](http://photonkit.com/) and [BootStrap](https://getbootstrap.com/) for visual style
- [ShareDB](https://github.com/share/sharedb) to stay in sync with the server-side code

The client also communicates with the server via WebSockets.