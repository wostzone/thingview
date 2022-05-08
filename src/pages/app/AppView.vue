<script lang="ts" setup>

import {onMounted, nextTick, reactive} from 'vue';
import {useQuasar} from "quasar";
import AppHeader from "./AppHeader.vue";

import router from '@/router'
import {appState} from '@/data/AppState'
import {accountStore, AccountRecord} from "@/data/accounts/AccountStore";
import {dashboardStore} from '@/data/dashboard/DashboardStore'
import { thingStore } from '@/data/thing/ThingStore';
import {consumedThingFactory} from '@/data/protocolbinding/ConsumedThingFactory'
const $q = useQuasar()


/** Popup a login page on authentication failure  */
const onAuthFailed = (account:AccountRecord, err:Error) => {
  if (!consumedThingFactory.connectionStatus.authenticated) {
    let newPath = "/accounts/"+account.id
    console.log("AppView.connectToHub: Navigating to account edit for account '%s': path=%s", account.name, newPath)
    router.push({name: "accounts.dialog", params: { accountID: account.id}})
  }
}

/**
 * Connect the protocol factory for the first active account
 */
const connectToHub = (accounts: ReadonlyArray<AccountRecord>) => {
  consumedThingFactory.setAuthFailedHandler(onAuthFailed)

// TODO: support multiple accounts
  // connect to the first enabled account
  for (let account of accounts) {
    if (account.enabled) {
      consumedThingFactory.connect(account, thingStore)
      .then(()=>{
        console.log("AppView.connectToHub: Connected to: ", account.name)
        $q.notify({
          position: 'top',
          type: 'positive',
          message: 'Connected to '+account.name,
        })
      })
      .catch((err:any)=>{
        // If authentication failed then open the login view
        console.warn("AppView.connectToHub: failed to connect to: %s, err='%s'", account.name, err)
        $q.notify({
          position: 'top',
          type: 'negative',
          message: 'Connection to '+account.name+' at '+account.address+' failed: '+err,
        })
      })
      break
    }
  }
}


/** Start the application, this loads the application state, accounts, dashboard store and
 * connects to the hub.
 */
onMounted(()=>{
  appState.load()
  thingStore.load()
  dashboardStore.load()
  accountStore.load()
  nextTick(()=>{
    // connect to the first enabled account
    connectToHub(accountStore.accounts)
  })
})

// future option for dark theme setting
// $q.dark.set(true) // or false or "auto"
// $q.dark.toggle()

</script>


<template>
<div class="appView">
  <AppHeader  :appState="appState"
              :dashStore="dashboardStore"
              :connectionStatus="consumedThingFactory.connectionStatus"/>
  <router-view></router-view>
</div>
</template>


<style>
.appView {
  display:flex;
  flex-direction: column;
}
</style>