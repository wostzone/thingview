<script lang="ts" setup>

import {nanoid} from "nanoid";
import {reactive} from "vue";
import {useQuasar, QBtn, QCard, QCardSection, QIcon, QToolbar, QToolbarTitle} from "quasar";
import {matAdd, matAssignmentInd} from "@quasar/extras/material-icons";

import EditAccountDialog from "./EditAccountDialog.vue";
import AccountsTable from './AccountsTable.vue'
import {appState} from '@/data/AppState'
import {accountStore, AccountRecord} from '@/data/accounts/AccountStore'

import router from '@/router'
import { thingFactory } from "@/data/protocolbinding/ThingFactory";

const data = reactive({
  selectedRow : AccountRecord,
  // showAddDialog: false,
  // showEditDialog: false,
  // record for editing. This is mutable
  // editRecord: new AccountRecord(),
})

const $q = useQuasar()

/**
 * Login to the account with the given password
 */
const handleLogin = (account:AccountRecord, password:string) => {
  thingFactory.connect(account, password)
}

const handleStartAdd = () => {
  console.log("AccountsView.handleStartAdd")
  router.push("/accounts/"+nanoid(5))
  // data.showAddDialog = !data.showAddDialog
  // data.editRecord = new AccountRecord()
  // data.editRecord.id = nanoid(5)
  // data.showEditDialog = !data.showEditDialog
}

const handleStartEdit = (record: AccountRecord) => {
  console.log("AccountsView.handleStartEdit. record=", record)
  // data.editRecord = record
  // data.showEditDialog = !data.showEditDialog
  router.push("/accounts/"+record.id)
}

// update the account and re-connect if connect
// const handleSubmitEdit = (record: AccountRecord) => {
//   data.showEditDialog = false
// }
// const handleCancelEdit = () => {
//   data.showEditDialog = false
// }

const handleStartDelete = (record: AccountRecord) => {
  console.log("AccountsView.handleStartDelete")
  // todo: ask for confirmation
  $q.dialog({
    title:"Delete Account?",
    message:"Please confirm delete account: '"+record.name+"'",
    ok:true, cancel:true,
  }).onOk(payload => {
    accountStore.remove(record.id)
  })
}

// toggle the enabled status
const handleToggleEnabled = (record: AccountRecord) => {
  console.log("AccountsView.handleOnToggleEnabled")
  if (record.enabled) {
    accountStore.setEnabled(record.id, false)
    thingFactory.disconnect()
  } else {
    accountStore.setEnabled(record.id, true)
    thingFactory.connect(record)
    .catch((err:any)=>{
      console.info("handleToggleEnabled. Error: %s", err)
    })
  }
}

</script>

 <!-- Display table of accounts.
      Popup a login dialog if authentication failed
   -->
<template>
  <div>
<!--  <EditAccountDialog v-if="data.showEditDialog"-->
<!--      :account="data.editRecord"-->
<!--      @onSubmit="handleSubmitEdit"-->
<!--      @onClosed="handleCancelEdit"-->
<!--  />-->

  <QCard class="my-card" flat>
        <!-- Title with 'add account' button  -->
    <QCardSection >
          <QToolbar>
            <QIcon :name="matAssignmentInd" size="28px"/>
            <QToolbarTitle shrink>Hub Accounts</QToolbarTitle>
            <QBtn v-if="appState.state.editMode"
                round  size="sm"
                color="primary" 
                :icon="matAdd"
              @click="handleStartAdd"
            />
          </QToolbar>
    </QCardSection>
    <QCardSection >
      <AccountsTable :accounts="accountStore.accounts"
                     title="Hub Accounts"
                     style="width: 100%"
                     :editMode="appState.state.editMode"
                     :connectionStatus="thingFactory.connectionStatus"
                     @onEdit="handleStartEdit"
                     @onDelete="handleStartDelete"
                     @onToggleEnabled="handleToggleEnabled"
                     @onLogin="handleLogin"
      >

      </AccountsTable>
    </QCardSection>

  </QCard>
  </div>
</template>
