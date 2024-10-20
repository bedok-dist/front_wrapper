Bedok-wrapper lib
==

Biblioteka do integracji REST API bedok.app wraz z frontendem aplikacji do zarządzania noclegami pracowniczymi Bedok.app.

Install
=

```sh
cd bed_ok
yarn add @bedok/front-wrapper
```

Development
==

```sh
# git clone this repo, cd
volta run --node=18.17.1 --yarn=1.22.19 yarn link
# cd to the project
volta run --node=18.17.1 --yarn=1.22.19 yarn link @bedok/front-wrapper
```

or package.json's dependencies

```
  "@bedok/front-wrapper": "link:./../bedok_wrapper",
```
