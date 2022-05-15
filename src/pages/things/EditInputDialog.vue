<script lang="ts" setup>

/** Dialog to edit an input value based on its TDDataSchema
 * Used for editing configuration value and action inputs.
 */

import {ref, reactive} from "vue"
import {useDialogPluginComponent, QForm, QInput} from "quasar"

import TDialog from "@/components/TDialog.vue"
import { TDActionAffordance, TDDataSchema } from "@/data/thing/ThingTD"

// inject dialog handlers
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()

// 
const props = defineProps<{
  /**
   * Name of the configuration or action input
   */
  actionName: string
  /**
   * The item whose value is being edited
   */
  readonly affordance: TDActionAffordance

  /**
   * Data schema to use. This determines the input components and validation
   */
  schema: TDDataSchema
}>()

const formRef = ref()

// actionParams is a action value
const actionParams = reactive({
    value: ""
});

const emits = defineEmits( [
  // REQUIRED; need to specify some events that your
  // component will emit through useDialogPluginComponent()
  ...useDialogPluginComponent.emits,
]);

// Submit the action
const handleSubmit = () =>{
  console.log("ActionInputDialog.handleSubmit: ")
  // put focus on invalid component
  formRef.value.validate(true)
      .then((isValid:boolean)=>{
        if (isValid) {
          console.info("ActionInputDialog.handleSubmit value is valid")
          onDialogOK(actionParams.value)
        } else {
          console.info("ActionInputDialog.handleSubmit new value is not valid")
        }
      })
};

</script>

<template>
  <TDialog
      ref="dialogRef"
      :title="'Edit action value for \''+props.actionName + '\''"
      @onClose="onDialogCancel"
      @onSubmit="handleSubmit"
      width="500px"
      showOk
      showCancel
  >
<p>{{props.actionName}}</p>
    <QForm @submit="handleSubmit"
           ref="formRef"
           >
      <QInput input-class="qinput" 
          v-model="actionParams.value"
              autofocus
              :placeholder="props.affordance.input?.default"
              type="text"
              label="Action Value"
              stack-label
              hide-bottom-space
      />

      </QForm>

  </TDialog>
</template>

<style>
/* placeholders should no look like input text */
.qinput::placeholder {
  font-style: italic;
  color:#3d3e4180 !important
}
</style>