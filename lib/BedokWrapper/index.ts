import BedokWrapper from './BedokWrapper.vue'
import Vue from 'vue'
// import type Vue from 'vue'

export { default as apiClient } from './apiClient'

export const BedokWrapperPlugin = {
  install(app) {
    app.component('BedokWrapper', BedokWrapper);
    const router = {}
    app.config.globalProperties.$routerBedokWrapper = router;
    let baseUrl = location.protocol==='https:' ? 'https://167.86.70.65:443' : 'http://167.86.70.65:8080';
    if ((window as any).baseUrl) { // @ts-ignore
      baseUrl = window.baseUrl; // @ts-ignore
    } else {
      (window as any).baseUrl = baseUrl; // @ts-ignore
    }
    const BedokObj = {
      baseUrl,
      distinctCities: ['Bełchatów', 'Łódź', 'Warszawa'],
      buildPayment(id, price) {
        return {
          "description": "RTV market",
          "currencyCode": "PLN",
          "customerIp": "127.0.0.1",
          "totalAmount": `${price}00`,
          // "extOrderId":"2uikc6gjd99b4lxc75ip5k",
          "buyer": {
              "email": "john.doe@example.com",
              "phone": "654111654",
              "firstName": "John",
              "lastName": "Doe",
              "language": "pl"
          },
          "products": [
            {
              "name": "Wireless Mouse for Laptop",
              "unitPrice": `${price}`,
              "quantity": "1"
            }
          ]
        };
      },
      saveCities(ads) {
        let citiesList = ads.map(e => e.data.city || e.city);
        const cities = [...new Set([...citiesList])];
        this.distinctCities = cities
        console.info('found distrinct cities', cities)
        return cities;
      },
      registerNewsletter(emailValue, {axios} = {axios: null}) {
        let resp;
        // resp = {status: 'ok'}
        resp = (axios as any)?.post?.(`${baseUrl}/newsletter`, {email: emailValue});
        // resp = resp.data
        // return Promise.resolve({resp, window });
        return resp?.then(resp => {
          return Promise.resolve({resp: resp.data, window });
        }).catch(r => {
          return Promise.resolve('err1')
        }) ?? Promise.resolve('err2')
      },
    }
    app.config.globalProperties.$bedok = BedokObj;
    let h = {orig: (a) => {}};
    (h as any).orig = undefined;
    const pluginRouter = {
      push(route) {
        console.info('$route.push', route)
        const glob = app.config.globalProperties
        if (route.path == "/advertisements") {
          if (route.query) {
            glob.onRoute(['adslist', route.query])
          }
        }
        console.info('useing h.orig', h.orig)
        return (h?.orig as any)?.push(route as any)
      },
    }
    if (!h.orig) {
      h.orig = app.config.globalProperties.$router
    }
    if (app.config.globalProperties.$router) {
      app.config.globalProperties.$routerOrig = app.config.globalProperties.$router
      app.config.globalProperties.$router = pluginRouter
      console.warn('There is already a global $router property (that is  good)');
    } else {
      app.config.globalProperties.$router = pluginRouter
    }
  }
}
// } as Vue.Plugin;

export declare interface TypesConfig {
}

declare module '@vue/runtime-core' {
  // extending existing types
  // https://github.com/vuejs/router/blob/v4.1.2/packages/router/tsconfig.json#L2

  export interface ComponentCustomProperties {
    // $route: TypesConfig extends Record<'$route', infer T> ? T : {}
    // $routerBedokWrapper: TypesConfig extends Record<'$routerBedokWrapper', infer T> ? T : {push({name: string}): any}
    $routerBedokWrapper: TypesConfig extends Record<'$routerBedokWrapper', infer T> ? T : {push(name3: {name3: string}): any}
    $apiVer: TypesConfig extends Record<'$routerBedokWrapper', infer T> ? T : 2;
  }
}

export default BedokWrapperPlugin;
