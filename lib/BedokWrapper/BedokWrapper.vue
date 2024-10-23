<template>
    <div>
      <slot name="menu" v-if="$slots.menu" v-bind="{onRoute, token, onLogout, onLogin, notifications, ...0?{q: 'q:rem'}:{} }"/>
      <div v-else-if="$attrs.dev">brak template dla slotu #menu {{page}}</div>
      <slot name="login" v-if="($slots.login) && (page == 9 || page == 'login')" v-bind="{ onRoute, token, apiClient, onLogin, onRegister, form }"/>
      <slot name="register" v-if="($slots.register) && (page == 'register')" v-bind="{ onRoute, token, apiClient, onLogin, onRegister, form }"/>
      <slot name="logout" v-if="($slots.logout) && (page == 10 || page == 'logout')" v-bind="{ onRoute, token, apiClient, onLogout, form }"/>
      <section v-if="(typeof page !== 'number' ? page?.length >= 2 : false) && page[0] == 'details'">
        <slot name="details" v-bind="{
          ad: findAdById(page[1]?.id || page[1]),
          adId: page[1]?.id ?? page[1],
          onRoute,
          form: formReserv,
          onReserve,
          editAd,
          doShare
        }">
          <h2>Szczegóły ogłoszenia</h2>
          <pre>{{JSON.stringify(page[1], null, 2)}}</pre>
          <button @click="onRoute('adslist')">powrót</button>
        </slot>
      </section>
      <section v-else-if="page[0] == 'order'">
        <slot name="order" v-bind="{
          adId: page[1],
          adDetails,
          ad,
          apiClient,
          onRoute,
          goToPayment,
        }">
          making the order {{ page[1] }}
          <br>
          <button @click="() => {if(0) debugger; apiClient.payment.create({amount: 1000})}">buy</button>
          <br>
          <button @click="() => onRoute(['details', page[1]])">back to the ad details</button>
        </slot>
      </section>
      <section v-else-if="page == 1 || page == 'mainpage'">
        <slot name="mainpage" v-bind="{
          apiClient,
          first30Ads,
          createAd,
          newModel,
          openAdDetails,
          openAdsByHost,
          onRoute,
          form,
          onSearch,
          window,
        }">
          <nav>start | menu | all</nav>
          <section>hero</section>
          <section>cecha1 | cecha2 | cecha3</section>
          <section>
            <ul>
              <li v-for="(ad, i) in first30Ads" :key="i" class="card">{{ad.data.title}}: <button>otwórz</button></li>
            </ul>
          </section>
        </slot>
      </section>
      <section v-else-if="page == 'reservationSuccess'">
        <slot name="reservationSuccess">[reservationSuccess]</slot>
      </section>
      <section v-else-if="page == 'adcreate' || page == 5">
        <slot name="adcreate" v-bind="{ createAd, newModel, onRoute, setNewModel: v => newModel = v }">
          <form method="dialog" @submit="() => {createAd(newModel)}">
            <input type="text" v-model="newModel.title" placeholder="tytuł" required><br>
            <input type="text" v-model="newModel.city" placeholder="miasto"><br>
            <input type="text" v-model="newModel.price" placeholder="cena"><br>
            <button type="submit">Dodaj</button>
          </form>
          <button @click="onRoute(1)">powrót</button>
        </slot>
      </section>
      <section v-else-if="page == 6 || page === 'blog'">
        <slot name="blog" v-bind="{ posts, onRoute }">
          (blog)
          <pre v-for="(post, i) in posts" :key="i" style="resize: both; overflow: auto; width: 300px; height: 100px;">{{
            JSON.stringify(post, null, 2)
          }}</pre>
          <button @click="onRoute(1)">powrót</button>
        </slot>
      </section>
      <slot v-else-if="page === 'profile' || page == 7" name="profile" v-bind="{ onRoute, apiClient, token, myAds, myData, updateAd, tempAds, editAd, ad, window, triggerReload: () => onRoute(page), openAdDetails}">
        no #profile template provided
        <br>
        <textarea
          :value="(() => {if(0) debugger; const {myReservations, ...data} = myData; return JSON.stringify(data)})()"
          @blur="ev => apiClient.profile.update(JSON.parse(ev.target.value))"></textarea>
      </slot>
      <slot v-else-if="page === 'adedit' || page == 17 || page[0] === 'adedit'" name="adedit" v-bind="{ onRoute, apiClient, myAds, myData, updateAd, token, tempAds, editAd, ad, adId: page[1], editAdId, triggerReload: () => onRoute(page) }">
        no #adedit template provided
      </slot>
      <section v-else-if="page == 2 || page == 'adslist' || page?.[0] === 'adslist'">
        <slot name="adslist" v-bind="{
          page,
          adsEntries: ads,
          ads: ads.map(e => e.data ?? (()=>{throw 'slot name=adslist no data prop'})()),
          createAd,
          newModel,
          removeAd,
          isLoading,
          openAdDetails,
          openAdsByHost: hostId => onRoute(['adslist', 'unpack', hostId]),
          onRoute,
          token,
          form,
          formReserv,
          editAd,
          ad,
          editAdId,
          doShare,
          apiClient,
          onSearch,
        }">
          <div>
            page
          </div>
        </slot>
      </section>
      <section v-else-if="0">
        v-bind:page={{page}}
        <button @click="onRoute(1)">powrót</button>
        <slot v-bind="{ page, ads, createAd, isLoading, onRoute, form }">
          <pre :title="JSON.stringify({ page, ads, createAd, isLoading, onRoute }, null, 2)">props</pre>
        </slot>
      </section>
      <dialog v-if="isRouterView" id="routerView">
        <component v-if="routeFromRouter?.component" :is="routeFromRouter.component" v-bind="{route: routeFromRouter}"/>
      </dialog>
    </div>
</template>

<script lang="ts">
import * as VueAll from 'vue';
const { ref, onMounted, onUnmounted, defineProps, defineEmits, watch, unref, provide } = VueAll
import axios from 'axios';
import { computed } from 'vue';
import apiClient from './apiClient'
// const apiClient = {}

const DEBUG = (window as any).DEBUG;

const initPageVal = (location.hash.includes(',') ? location.hash.substring(1).split(',') : (location.hash.substring(1) || 1)) as number | number & {length: number} | any[] | string | [{id: number}, any]

const page_internal = ref(initPageVal);

if (!'wont be used as outside setup()')
watch(page_internal, (page, prevPage) => {
  if (DEBUG) console.info('watch:page', page)
}, {
  immediate: true
})

const emit = defineEmits(['update:page'])

const data = ref({})

const ads = ref([] as {data: any}[])
const first30Ads = ref([] as {data: any}[])
const myData = ref({})
const myAds = ref([])
const ad = ref({title: 'no ad data'})
const adDetails = ref({title: 'no ad data'})

let apiVer = 1

let { baseUrl } = (window as any);

const queryParams = new URLSearchParams(window.location.search);
if (queryParams.has('baseUrl')) {
  baseUrl = queryParams.get('baseUrl');
}

const notifications = ref([] as any[])

// TODO invalidate (read as undefined) token if expired
const token = ref((localStorage.token || undefined) as undefined | string)

async function onLogin(form) {
  const loginResp = await axios.post(`${baseUrl}/host/login`, form)
  // const tokenValue = 'abc'
  // debugger
  if (DEBUG) console.info('logging in')
  const tokenValue = loginResp.data.token
  token.value = tokenValue;
  // localStorage.setItem('token', unref(token) ?? '')
  localStorage.setItem('token', tokenValue)
  return onRoute(1);
}

function onLogout() {
  token.value = undefined;
  onRoute('login');
}

const headers = computed(() => {
  return {
    'Authorization': `${token}`,
  }
})

let appInstance;

async function onRoute(pageDef: typeof page_internal.value, postHandler) {
  if (DEBUG) console.info('onRoute', pageDef)
  if (typeof pageDef == 'number') {
    console.warn('onRoute(number) nie jest zalecany, użyj mainpage, adslist, login, details, adedit, adcreate, profile, order')
  }
  let ret = false
  const isMainPage = pageDef == 1 || pageDef == 'mainpage';
  const isAdsList = pageDef == 2 || pageDef == 'adslist';
  // debugger
  if (localStorage.token) {
    apiClient.notifications.findAll().then(r => {
      notifications.value = r;
    })
  }
  if (isMainPage || isAdsList) {
    apiClient.ads.findAll().then(adsList => {
      ads.value = adsList
      first30Ads.value = adsList
    })
  };
  if (pageDef[0] == 'adslist') {
    ads.value = []
    apiClient.ads.findFiltered(pageDef[1]).then(filteredAdsList => {
      ads.value = filteredAdsList
    })
  }
  if (pageDef[0] == 'details') {
    // debugger
    // adId.value = pageDef[0];
    adDetails.value = {'title': 'from onRoute'}
    ad.value = adDetails.value
    if (postHandler) {
      const routeParams = {
        id: pageDef[1],
      }
      postHandler(routeParams);
      // if (appContext.globalProperties.$route) {
      //   appContext.globalProperties.$route.params = {
      //     id: pageDef[1],
      //   }
      // }
    }
    ret = true; // prevent resetting query
  }
  if (pageDef[0] == 'adedit') {
    // updateAd, ad, editAdId, onRoute
    ad.value = {title: 'Ad from onRoute adedit'}
    ad.value = await apiClient.ads.findOne(pageDef[1])
    // debugger
  }
  if (pageDef[0] == 'order') {
    const q = appInstance.config.globalProperties.$route.query
    if (!(q.guestsCount && q.from && q.to && q.id)) {
      console.warn('missing route params')
    }
    // debugger
    adDetails.value = {'title': 'from onRoute'}
    ad.value = adDetails.value
    // const qp = appContext.config.globalProperties.$route.queryParams
    // if (!qp) {
    //   console.warn('zeby wykonac rezerwację, trzeba wejść z linku mającego odpoiednie parametry')
    // }
    ret = true; // has to force-stop, as we rely on $route.query for compat
  }
  if (pageDef == 7 || pageDef == 'profile') {
    const resp = await apiClient.profile.findSingle()
    const mineads = await apiClient.profile.findMyAds()
    // debugger
    myAds.value = mineads
    myData.value = resp
    // myData.value['myAds'] = myAds // WRONG: wont reactively update myData (its reference does not change)
    // resp.myAds = myAds
    // myData.value = {...myData.value}
    // return true; // do not use vue-router's $route.push (force-stop)
    ret = true // stores return values as we have ending actions
  }
  if (pageDef == 10) {
    // page_internal.value = 'login'
    pageDef = 'login'
    // return;
  }
  page_internal.value = pageDef
  location.hash = (pageDef as any).push ? (pageDef as any[]).join(',') : (pageDef as string);
  // return true;
  return ret;
}

function openAdDetails(ad) {
  // debugger
  if (!ad.id && ad.data?.advertisementId) {
    ad.id = ad.data.advertisementId
  }
  // TODO loading ad details
  if (DEBUG) console.info('openingAdDetails', ad);
  const emitDetails = ['details', ad.id || ad.advertisementId];
  // cb(...emitDetails)
  onRoute(emitDetails)
  return Promise.resolve(ad)
};

export default {
  mounted() {
    onRoute(page_internal.value)
  },
  props: ['page0'],
  computed: {
  },
  // watch: {
  // },
  setup(props, host) {
    const inst = VueAll.getCurrentInstance();
    let globalProperties = {};
    if (inst) {
      const { appContext } = inst
      appInstance = appContext
      // const globalProperties = appContext.config.globalProperties;
      globalProperties = appInstance.config.globalProperties
    }

    VueAll.onBeforeMount(() => {
      const instance = VueAll.getCurrentInstance()
      if (instance) {
        instance.appContext.config.globalProperties.onRoute = onRoute
      }
      // fallback for updating $route.params.id
    })
    onMounted(async () => {
      if (page_internal.value !== 1) {
        host.emit('update:page', page_internal.value)
      }
    })
    watch(() => page_internal.value, (page) => {
      // debugger
      if (page[0] == 'details') {
        host.$route
        globalProperties.$route.params = {
          id: page[1],
        }
      }
    }, {immediate: true})
    provide('onRoute', onRoute)
    let isPageAttrSyncing = false
    const { emit, attrs } = host
    if (DEBUG) console.log('onmounted')
    watch(() => host.attrs.page, (page) => {
      if (page !== undefined && isPageAttrSyncing) {
        if (DEBUG) console.log('watching attrs.page', page)
        page_internal.value = page as any
      } else if (DEBUG) console.info('ignored page.sync')
    }, {immediate: true})
    onMounted(() => {
      isPageAttrSyncing = true
    })
    const page = computed(() => {
      return page_internal.value
    });
    function onSearch(data) {
      // debugger
      if (globalProperties.$route.query.from) {
        // setting from
      }
      globalProperties.$route.query = {
        from: '2024-10-20',
        to: '2024-10-21',
        guestsCount: 1,
        // id: '',
      }
    }
    function editAd(adId, ad, ...rest) {
      // debugger
      onRoute(['adedit', adId])
    }
    return {
      page_internal,
      page,
      window,
      ...data,
      token,
      apiClient,
      form: 0,
      ads,
      isLoading: 0,
      newModel: {
        title: '',
        city: '',
        price: '',
      },
      isRouterView: 0,
      findAdById(...args: any[]) {},
      formReserv: 0,
      editAd,
      doShare: 0,
      first30Ads,
      openAdDetails,
      // openAdDetailsWrapper(ad, ...args) {
      //   if (DEBUG) console.info('openAdDetails component method call')
      //   const self = this as any
      //   return openAdDetails((...arr) => emit('update:page', arr), ad, ...args)
      // },
      posts: 0,
      removeAd: 0,
      createAd(...args) {},
      openAdsByHost: hostId => onRoute(['ads', 'unpack', hostId]),
      goToPayment: 'use apiClient, go to goToPayment',
      ad,
      editAdId: 0,
      adDetails: {},
      myAds,
      myData,
      updateAd: 0,
      tempAds: 0,
      notifications,
      onLogin,
      onRegister: 0,
      onReserve: 0,
      onLogout,
      onSearch,
      onRoute,
      routeFromRouter: {component: null},
      orderData: {},
    }
  },
}
</script>
