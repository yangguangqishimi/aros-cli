# aros-cli
A simple CLI for scaffolding [weex](http://weex.apache.org/cn/) projects, we provide [aros-template](https://github.com/yangguangqishimi/aros-template) to quickly build small and medium sized app.

## Installation
Prerequisites: Node.js (>=4.x, 6.x preferred), npm version 3+ and Git.

```
$ npm install -g aros-cli
```

If you were in China, we recommand you install [cnpm](https://npm.taobao.org/) before.

```
$ cnpm install -g aros-cli
```

## Usage
You can code `aros -h` to show a profile.
```
aros-cli:
The following instructions are provided to help you build app !

 build      | build for aros project.
 dev        | start dev server.
 init       | generate aros template.
 install    | install aros platform and components' librarys.
 pack       | pack full dose zip and send to aros platform project.
 update     | update aros-template file by path.
 mock       | start a mock server.
```

## Command
#### **build**: 

aros cli build prod's full zip, contain js bundle, assets/images and iconfont. 
```
$ aros build
```
build full zip and copy to specified path, post full zip info to your server, you can use [aros-publish](https://github.com/yangguangqishimi/aros-publish) for collocation.
```
$ aros build -s url
```
build full zip and copy to specified path, generate full zip and diff zip in  [aros-template](https://github.com/yangguangqishimi/aros-template)'s dist folder.
```
$ aros build -d
```
build full zip and copy to specified path, generate full zip and diff zip in  [aros-template](https://github.com/yangguangqishimi/aros-template)'s dist folder， post full zip info to your server at same time.
```
$ aros build -s url -d
```
#### **dev**:

start dev server, you can change default `server.path` and `server.port` in `aros-template/config/aros.dev.js`, aros' app can refresh current view when your local code is changed and saved, **You can debug by forward agent software in real machine.**

forward agent software recommand:

* windows: fidder
* ios: charles

```
$ aros dev
```
#### **init**:

generate [aros-template](https://github.com/yangguangqishimi/aros-template) in current execution directory, you can quickly build your app through
 it.
```
$ aros init
```

#### **pack**
build prod's full zip and send it to platforms's ios/android built-in package storage path.
```
$ aros pack
```

pack aros ios inner js bundle.
```
$ aros pack ios
```
pack aros android inner js bundle.
```
$ aros pack android 
```
pack aros ios && android inner js bundle.
```
$ aros pack all
```

## Develop & Test

* cd aros-template or aros init project `parent directory`.
* git clone https://github.com/yangguangqishimi/aros-cli
* cd aros-cli && git checkout dev
* npm/cnpm i
* cd aros-template or aros init project
* node ../aros-cli/bin/aros.js + command
