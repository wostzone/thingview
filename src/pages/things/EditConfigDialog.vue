<script lang="ts" setup>

/** Dialog to edit a configuration value
 * Intended to be used to submit a request for a configuration change to an exposed thing
 */

import {ref, reactive} from "vue"
import {useDialogPluginComponent, QForm, QInput} from "quasar"

import TDialog from "@/components/TDialog.vue"
import { IDashboardTileItem } from "@/data/dashboard/DashboardStore"
import {InteractionOutput } from "@/data/thing/InteractionOutput"
import { TDPropertyAffordance } from "@/data/thing/ThingTD"

// inject dialog handlers
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()

// 
const props = defineProps<{
  /**
   * Name of the property whose value to change
   */
  propName: string
  /**
   * The item whose value is being edited
   */
  readonly affordance: TDPropertyAffordance
  /**
   * The current value to be changed
   */
  readonly currentValue: InteractionOutput
}>()

const formRef = ref()

// editItem is a copy the original value being edited
const editItem = reactive({
    newValue: props.currentValue.asText
});

const emits = defineEmits( [
  // REQUIRED; need to specify some events that your
  // component will emit through useDialogPluginComponent()
  ...useDialogPluginComponent.emits,
]);

// Submit the updated tile item label
const handleSubmit = () =>{
  console.log("EditConfigDialog.handleSubmit: ")
  // put focus on invalid component
  formRef.value.validate(true)
      .then((isValid:boolean)=>{
        if (isValid) {
          console.info("EditConfigDialog.handleSubmit new value is valid")
          onDialogOK(editItem.newValue)
        } else {
          console.info("EditConfigDialog.handleSubmit new value is not valid")
        }
      })
};

</script>

<template>
  <TDialog
      ref="dialogRef"
      :title="'Edit Configuration Value of \''+props.propName + '\''"
      @onClose="onDialogCancel"
      @onSubmit="handleSubmit"
      width="500px"
      showOk
      showCancel
  >
<p>{{propName}}</p>
    <QForm @submit="handleSubmit"
           ref="formRef"
           >
      <QInput input-class="qinput" 
          v-model="editItem.newValue"
              autofocus
              :placeholder="props.currentValue"
              type="text"
              label="New Value"
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