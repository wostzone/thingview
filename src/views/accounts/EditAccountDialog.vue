<script lang="ts" setup>
import {reactive, ref, watchEffect} from "vue";
import TDialog from "@/components/TDialog.vue";
import {useDialogPluginComponent, QCardSection, QField, QForm, QInput, QSpace, QToggle} from "quasar";
import {accountStore, AccountRecord} from "@/data/accounts/AccountStore";
import {useRouter} from "vue-router";
import { thingFactory } from "@/data/protocolbinding/ThingFactory";

/**
 * View/Edit account details
 */
const props = defineProps<{
  /**
   * The account to view or edit
   */
  account: AccountRecord,
  /**
   * When invoked via router, navigate to this path on close
   */
  returnTo?: string|object,
}>()

const router = useRouter()

const { dialogRef, onDialogOK, onDialogHide } = useDialogPluginComponent();


let data = reactive({
  editRecord: props.account ? {...props.account} : accountStore.newAccountRecord(),
  password: "",
})

// to be able to validate the form
let editFormRef = ref()

// replace the edit record with a copy of the account that was updated in props
watchEffect(()=>{
  Object.assign(data.editRecord, {...props.account})
})

const emit = defineEmits([
  'onSubmit', // AccountRecord
  'onClosed',
    ...useDialogPluginComponent.emits,
])

const handleClose = () => {
  console.log("EditAccountDialog.handleClose")
  if (props.returnTo) {
    router.push(props.returnTo)
  }
  onDialogHide()
  // emit('onClosed')
}

/**
 * Save the new account in the store and submit an event with the new record
 * and close the dialog
 */
const handleSubmit = () =>{
  console.log("EditAccountDialog.handleSubmit: ", data.editRecord)
  if (!editFormRef.value) {
    return
  }
  editFormRef.value.resetValidation();
  editFormRef.value.validate(true)
    .then((success:boolean)=>{
      if (success) {
        accountStore.update(data.editRecord)
        // connectionManager.Connect(data.editRecord)
        if (data.editRecord.enabled && data.password) {
          thingFactory.connect(data.editRecord, data.password)
        } else if (!data.editRecord.enabled) {
          // this the active account got disabled, disconnect the factory
          if (data.editRecord.id == thingFactory.connectionStatus.account?.id) {
            thingFactory.disconnect()
          }
        }
        emit('onSubmit', data.editRecord)
        // handleClose()
        onDialogOK()
      }
    })
};

</script>

<template>
  <TDialog ref="dialogRef"
      :title="props.account ? 'Edit Account' : 'Add Account'"
      @onClosed="handleClose"
      @onSubmit="handleSubmit"
      showCancel showOk
      :okDisabled="(data.editRecord.name==='')"
  >
    <QForm ref="editFormRef"
           @submit="handleSubmit"
           class="q-gutter-auto "
           style="min-width: 350px"
    >
      <QInput v-model="data.editRecord.name" 
              dense autofocus  
              id="accountName" 
              label="Account name"
              :rules="[()=>data.editRecord.name !== ''||'Please provide an account name']"
      />
      <QInput v-model="data.editRecord.loginName" 
              dense 
              id="loginName" type="text"
              label="Login name"
              :rules="[()=>data.editRecord.loginName !== ''||'Please provide a login name']"
      />
      <QInput v-model="data.password"
              dense
              id="password" type="password" 
              label="Password"
              hint="(Use only to re-authenticate. Passwords are not stored)"
      />
      
      <QInput v-model="data.editRecord.address"
              borderless  
              id="address" type="text" 
              label="Address"
      />
      <QCardSection class="q-pa-none q-ml-xl" style="max-width:300px">
        <QInput v-model="data.editRecord.authPort"
                id="authPort" type="number" 
                filled dense 
                label="Authentication port (default 8881)"
        />
        <QInput v-model="data.editRecord.directoryPort"
                id="dirPort" type="number" 
                filled dense 
                label="Directory Service port (default 8886)"
        />
        <QInput v-model="data.editRecord.mqttPort"
                id="mqttPort" type="number" 
                filled dense 
                label="MQTT Broker Websocket Port (default 8885)"
        />
      </QCardSection>
      <QField
         :rules="[()=>!(data.password !== ''&& !data.editRecord.enabled)||'Enable the account to use the given password']"
         borderless 
         class="q-ma-none"
      >
      <QToggle v-model="data.editRecord.enabled"
              id="enabled" type="boolean" 
              class="q-mt-md q-mb-none q-pb-none"
              label="Enabled"

      />
      </QField>
      <QToggle v-model="data.editRecord.rememberMe"
              id="rememberMe" type="boolean" 
              class="q-ma-none q-pb-none"
              label="Remember Login (use only on trusted computers)"
              

      />
    </QForm>

  </TDialog>
</template>
