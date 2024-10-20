let axios, baseUrl, apiVer, headers;
export default {
  setAxios(instance) {axios = instance},
  setBaseUrl(value) {baseUrl = value},
  setApiVer(value) {apiVer = value},
  setHeaders(value) {headers = value},
  setConfig(conf) {
    ({axios, baseUrl, apiVer, headers} = conf);
  },
  ads: {
    async findAll() {
      if (apiVer == 2) {
        return (axios(`${baseUrl}/api/ads`)).then(resp => {
          const data = resp.data
          return data;
        })
      } else {
        return axios(`${baseUrl}/advertisement/list`, {headers: headers}).then(resp => {
          const data = resp.data
          const adsList = data.map((e, i) => {
            return {id: e.id ?? e.advertisementId, data: e};
          });
          return adsList
        })
      }
    },
    async findFiltered(filter) {
      let { city } = filter
      // some fallback functionality
      if (!city && filter.location) {
        city = filter.location
      }
      return axios(`${baseUrl}/advertisement/list`, {headers: headers.value}).then(resp => {
        let list = resp.data
        console.info('filtering ads')
        list = list.filter(e => { // TODO replace with REST API call
          if (city) {
            return e.city == city;
          }
          return true;
        })
        // backward interface compatibility
        return list.map((e, i) => {
          return {id: e.id ?? e.advertisementId, data: e};
        });
      })
    },
  }, // ads
  profile: {
    async findSingle() {
      if (apiVer == 2) {
        return (axios(`${baseUrl}/api/user-permissions`)).then(resp => {
          return resp.data
        });
      } else {
        let profile = {myReservations: []}
        axios(`${baseUrl}/host`).then(resp => {
          // profile = resp.data
          Object.assign(profile, resp.data) // referencial stability
        });
        const r = await axios(`${baseUrl}/advertisement/host`)
        profile.myReservations = r.data
      }
    },
  },
  }
}
