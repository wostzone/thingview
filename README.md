# Thing View

This thingview plugin lets users view and update Things through a webbrowser.

## Objective

Provide a secure user interface to view, control and configure Things using a web browser.

## Status

The status of this plugin is in-development. It is operational but limited in functionality. 
- Connection management
  - Account management: basic
  - Connect to Thing Directory: basic
  - Connect to message bus: basic
  - Proxy server: basic
  - Configuration file for hostname and port
- Admin panel: 
  - view/edit users: todo
  - add/remove users: todo
  - manage groups: todo
- Overview of known Things
  - View list of Things: basic
  - Configure Thing: todo
- Dashboard
  - Manage Dashboards: done
  - Multi-breakpoint tiled layout: basic 
  - Store layout with account: todo
- View/edit dashboard widget tiles
  - Single-value card: in development
  - Multi-value card: todo
  - Image card: todo
  - Temperature gauge: todo
  - on/off switch: todo
  - Line graph (sensor values): todo
  - Bar graph: todo
- Plugin dashboard widgets
  - Integrate with widgets from plugins: todo
  - Show recent notifications: todo



## Audience

This project is aimed at IoT developers that value the security and interoperability that WoST brings. WoST Things are more secure than traditional IoT devices as they do not run a server, but instead connect to a Hub to publish their information and receive actions.

## Summary

This plugin consists of a web client that presents a user interface to display, control and configure Things. This client is implemented in Vue-3 and Typescript.

This client uses the username/password authentication service to login and manage its configuration, including user configuration for the dashboard. After login it uses the Thing Directory Service API to retrieve discovered Things and connects to the MQTT message bus to receive status updates from Thing devices and send action and configuration update to Thing devices. 

A valid user login is required to use this service. Authentication is provided by the Hub auth service. A secure http cookie holds a refresh token so login is only needed after it has expired, typically a couple of weeks of no usage.

Support for dashboard configuration storage is supported via the user account configuration store of the authentication service. 

A dynamic grid layout (vue-grid-layout) lets the user place and resize tiles onto a dashboard. The dashboard layout has multiple screen size breakpoints to place the layout optimally for the screen form factor.


Connection to hub services run via the node express proxy. It is possible to connect to services like authentication and directory services directly using their port, but his is optional. By default the express service is used as a proxy to connect to these services. The benefit is that cross-scripting is not needed which improves the security of the refresh token.


## Build and Installation

yarn is used to manage the build.

* yarn:         download all required packages from NPM
* yarn dev:     start a dev server for development
* yarn clean:   remove temporary and cached files
* yarn build:   to build a production version of the application
* yarn dist:    to build an executable that contains the full application, including proxy and SPA
* yarn install: to install as a local user into ~/bin/wosthub

### Dependencies (tentative)

External dependencies are:
* yarn: node package manager
* mosquitto: a MQTT broker
* libwebsocket-4.2.1: Required for firefox to work with http/2

See package.json for a list of package dependencies. Key dependencies are:
* Language Framework: Vue3 + Typescript
* UI library: quasar
* Build tool: vite  (can't really recommend it as debugging sourcemaps are wrong)
* nodejs with express and http-proxy-middleware



## Usage

Point a webbrowser to the server. Default from server.js is localhost:8443. 
A login page prompts. The Hub auth utility can be used by the administrator to create a login. 


