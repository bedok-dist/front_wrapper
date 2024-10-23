import BedokWrapper from './BedokWrapper.vue'
import Vue from 'vue'
// import type Vue from 'vue'

import apiClient from './apiClient'

export { default as apiClient } from './apiClient'

const DEBUG = (window as any).DEBUG;

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
      apiClient,
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
      goToPayment(data = '$buildPayment()', ctx) {
        const { $route } = ctx
        // debugger
        console.log('goToPayment')
        window.alert('Inicjalizowanie płatności... poczekaj lub sprawdź devtools');
        // TODO append here somehow returnUrl
        return apiClient.payment.create(data)
          .then((r) => {
            // TODO history.push
            // debugger;
            console.info('redirecting')
            const url = r.data['redirectUri']
            const doRedir = window.confirm(`Zostaniesz przeniesiony na ${url} celem płatności, czy chcesz tego (jeśli nie, to płatność NIE będzie już możliwa (nie przechowujemy linku w danych profilu))`)
            if (doRedir) {
              location.href = url;
            }
          })
      },
      saveCities(ads) {
        let citiesList = ads.map(e => e.data.city || e.city);
        const cities = [...new Set([...citiesList])];
        this.distinctCities = cities
        console.info('found distrinct cities', cities)
        return cities;
      },
      async duplicateAd(adId) {
        const ad = apiClient.ads.findOne(adId)
        const adStr = window.prompt('new ad def', JSON.stringify(ad, null, 2))
        // const newAd = JSON.parse(adStr)
        // location.href = '/'
        app.config.globalProperties.onRoute(['adedit', adId])
      },
      polyfillRouterQuery(params, {self} = {}) {
        // debugger
        if (DEBUG) console.info('vue-router parseUrl is reseting that', {query: app.config.globalProperties.$route.query})
        const query11 = {
          id: params.id,
          from: '2024-10-20',
          to: '2024-10-24',
          guestsCount: 9
        };
        app.config.globalProperties.$route.query = query11;
        setTimeout(() => {
          if (DEBUG,1) console.info('query2:', {query: app.config.globalProperties.$route.query})
          app.config.globalProperties.$route.query = query11
          setTimeout(() => {
            app.config.globalProperties.$route.query = query11
            if (DEBUG,1) console.info('query3:', {query: app.config.globalProperties.$route.query})
          }, 1000)
        }, 100)
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
        if (DEBUG) console.info('$route.push', route)
        const glob = app.config.globalProperties
        let isSkipRouterPush = false;
        if (route.path == "/advertisements") {
          if (route.query) {
            isSkipRouterPush = glob.onRoute(['adslist', route.query])
          }
        }
        if (route.name == "AdvertisementDetails") {
          if (route.params) {
            debugger
            console.info('route.param.id', route.params.id, {params: route.params})
            isSkipRouterPush = glob.onRoute(['details', route.params.id])
            isSkipRouterPush = true
          }
        }
        if (route.name == 'OrderSummaryView') {
          console.warn('WARN: route.push for OrderSummaryView in SingleFullAd can be replaced with emit(make-booking)')
          if (route.query) {
            isSkipRouterPush = glob.onRoute(['order', route.params?.id ?? route.query?.id])
          }
        }
        if (isSkipRouterPush) {
          return;
        }
        if (DEBUG) console.info('useing h.orig', h.orig)
        return (h?.orig as any)?.push(route as any)
      },
    }

    // we will just skip literally every route and just capture all calls to push
    app.config.globalProperties.$router.beforeEach((to, from) => {
      console.info('route:before', to, 'from=', from, 'will be skipped')
      return false
    })
    if (!h.orig) {
      h.orig = app.config.globalProperties.$router
    }
    if (app.config.globalProperties.$router) {
      app.config.globalProperties.$routerOrig = app.config.globalProperties.$router
      app.config.globalProperties.$router = pluginRouter
      if (DEBUG) console.warn('There is already a global $router property (that is  good)');
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
