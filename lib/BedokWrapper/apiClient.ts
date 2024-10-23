let axios, baseUrl = '', apiVer, headers;
// export default {}

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
    async findOne(id) {
      const headers = {
        'Authorization': localStorage.token,
      };
      const ad = await axios(`${baseUrl}/advertisement/details/${id}`, {headers: headers})
      return ad.data
      return Promise.resolve({id: 1, data: {title: "Ad's title"}})
    },
    async findFiltered(filter) {
      let { city } = filter
      // some fallback functionality
      if (!city && filter.location) {
        city = filter.location
      }
      return axios(`${baseUrl}/advertisement/list`, {headers: headers}).then(resp => {
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
        axios(`${baseUrl}/host`, {
          headers: {
            'Authorization': localStorage.token,
          },
        }).then(resp => {
          // profile = resp.data
          Object.assign(profile, resp.data) // referencial stability
        });
        const r = await axios(`${baseUrl}/advertisement/host`, {
          headers: {
            'Authorization': localStorage.token,
          },
        })
        profile.myReservations = r.data
        return profile;
      }
    },
    async update(data) {
      // TODO data structure validation
      if (!data['dateOfBirth']) {
        // YYYY-MM-DD
        return Promise.reject('missing dateOfBirth, e.g. "dateOfBirth": "1900-01-01"')
        return;
      }
      const resp = await axios.put(`${baseUrl}/host`, data, {
        headers: {
          'Authorization': localStorage.token,
        },
      })
      return resp;
    },
    async findMyAds() {
      const resp = await axios(`${baseUrl}/advertisement/host?sort=createdAt:DESC`, {
        headers: {
          'Authorization': localStorage.token,
        },
      })
      let list = resp.data
      // list = list.map((e, i) => {
      //   return {id: e.id ?? e.advertisementId, data: e};
      // })
      return list
    },
  },
  notifications: {
    async findAll() {
      const resp = await axios(`${baseUrl}/host/notifications`, {
        headers: {
          'Authorization': localStorage.token,
        },
      })
      let list = resp.data
      return list;
    },
  },
  payment: {
    create(data) {
      if (this.$apiVer == 2) {
        // const data = this.$bedok.buildPayment(adOrAdId.id ?? adOrAdId, 100);
        axios.post(`${(window as any).baseUrl}/payu/transactions`, data).then(r => {
          location.href = r.data['transaction']['redirectUri'];
        })
      } else {
        // const data = this.paymentData ?? {
        //   "advertisementId": this.id,
        //   "dateFrom": this.from,
        //   "dateTo": this.to,
        // }
        return axios.post(`${(window as any).baseUrl}/reservation/user`, data, {
          headers: {
            'Authorization': localStorage.token,
          },
        })
      }
    }
  },
  deleteAdById() {
    return Promise.reject('not impl yet')
  },
}
/*
*/
