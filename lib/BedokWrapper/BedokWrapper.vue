<template>
    <div>
      <slot name="menu" v-if="$slots.menu" v-bind="{onRoute, token, onLogout, onLogin, notifications, ...0?{q: 'q:rem'}:{} }"/>
      <div v-else-if="$attrs.dev">brak template dla slotu #menu {{page}}</div>
      <slot name="login" v-if="($slots.login) && (page == 9 || page == 'login')" v-bind="{ onRoute, token, apiClient, onLogin, onRegister, form }"/>
      <slot name="register" v-if="($slots.register) && (page == 'register')" v-bind="{ onRoute, token, apiClient, onLogin, onRegister, form }"/>
      <slot name="logout" v-if="($slots.logout) && (page == 10 || page == 'logout')" v-bind="{ onRoute, token, apiClient, onLogout, form }"/>
      <section v-if="(typeof page !== 'number' ? page?.length >= 2 : false) && page[0] == 'details'  ||  ((() => {const ret = page[0] == 'order'; if(0) debugger; return ret})())">
        <slot name="details" v-bind="{ad: findAdById(page[1]?.id || page[1]), adId: page[1]?.id ?? page[1], onRoute, form: formReserv, onReserve, editAd, doShare}">
          <h2>Szczegóły ogłoszenia</h2>
          <pre>{{JSON.stringify(page[1], null, 2)}}</pre>
          <button @click="onRoute('adslist')">powrót</button>
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
      </slot>
      <slot v-else-if="page === 'adedit' || page == 17 || page[0] === 'adedit'" name="adedit" v-bind="{ onRoute, apiClient, myAds, myData, updateAd, token, tempAds, editAd, ad, editAdId, triggerReload: () => onRoute(page) }">
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
          openAdDetails1: ad => page = ['details', ad],
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

const initPageVal = (location.hash.includes(',') ? location.hash.substring(1).split(',') : (location.hash.substring(1) || 1)) as number | number & {length: number} | any[] | string | [{id: number}, any]

const page_internal = ref(initPageVal);

watch(page_internal, (page, prevPage) => {
  console.info('watch:page', page)
}, {
  immediate: true
})

const emit = defineEmits(['update:page'])

const data = ref({})

const ads = ref([] as {data: any}[])
const first30Ads = ref([] as {data: any}[])
const myData = ref({})
const myAds = ref([])

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
  console.info('logging in')
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

async function onRoute(pageDef: typeof page_internal.value) {
  console.info('onRoute', pageDef)
  const isMainPage = pageDef == 1 || pageDef == 'mainpage';
  const isAdsList = pageDef == 2 || pageDef == 'adslist';
  if (isMainPage || isAdsList) {
    apiClient.ads.findAll().then(adsList => {
      ads.value = adsList
      first30Ads.value = adsList
    })
  };
  if (pageDef[0] == 'adslist') {
    ads.value = []
    apiClient.ads.findFiltered(pageDef[1]).then(r => {
    })
  }
  if (pageDef == 7 || pageDef == 'profile') {
    myData.value = await apiClient.profile.findSingle()
  }
  page_internal.value = pageDef
  location.hash = (pageDef as any).push ? (pageDef as any[]).join(',') : (pageDef as string);
  return true;
}

function openAdDetails(cb, ad, ...rest) {
  if (!ad.id && ad.data?.advertisementId) {
    ad.id = ad.data.advertisementId
  }
  console.info('openingAdDetails', ad);
  const emitDetails = ['details', ad.id || ad.advertisementId];
  cb(...emitDetails)
};

export default {
  mounted() {
    onRoute(page_internal.value)
  },
  props: ['page0'],
  computed: {
  },
  watch: {
  },
  setup(props, host) {
    VueAll.onBeforeMount(() => {
      const instance = VueAll.getCurrentInstance()
      if (instance) {
        instance.appContext.config.globalProperties.onRoute = onRoute
      }
    })
    onMounted(async () => {
      if (page_internal.value !== 1) {
        host.emit('update:page', page_internal.value)
      }
    })
    provide('onRoute', onRoute)
    let isPageAttrSyncing = false
    const { emit, attrs } = host
    console.log('onmounted')
    watch(() => host.attrs.page, (page) => {
      if (page !== undefined && isPageAttrSyncing) {
        console.log('watching attrs.page', page)
        page_internal.value = page as any
      } else console.info('ignored page.sync')
    }, {immediate: true})
    onMounted(() => {
      isPageAttrSyncing = true
    })
    const page = computed(() => {
      return page_internal.value
    });
    return {
      page_internal,
      page,
      window,
      ...data,
      token,
      apiClient: 0,
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
      editAd: 0,
      doShare: 0,
      first30Ads,
      openAdDetails(ad, ...args) {
        console.info('openAdDetails component method call')
        const self = this as any
        return openAdDetails((...arr) => emit('update:page', arr), ad, ...args)
      },
      posts: 0,
      removeAd: 0,
      createAd(...args) {},
      openAdsByHost: hostId => onRoute(['ads', 'unpack', hostId]),
      ad: 0,
      editAdId: 0,
      myAds,
      myData,
      updateAd: 0,
      tempAds: 0,
      notifications,
      onLogin,
      onRegister: 0,
      onReserve: 0,
      onLogout,
      onSearch: 0,
      onRoute,
      routeFromRouter: {component: null},
    }
  },
}
</script>
