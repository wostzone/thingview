<script lang="ts" setup>

/** Dialog to edit a tile item Label 
 * Edit the label of a tile item to display, instead of using the item propery name
 * This label is shown in the tile card
 */

import {ref, reactive} from "vue";
import {useDialogPluginComponent, QForm, QInput} from "quasar";

import TDialog from "@/components/TDialog.vue";
import { IDashboardTileItem } from "@/data/dashboard/DashboardStore";
// import { TDPropertyAffordance } from "@/data/thing/ThingTD";

// inject dialog handlers
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent();

// 
const props = defineProps<{
  tileItem: IDashboardTileItem
  defaultLabel: string
}>()


const formRef = ref()


// editLabel is a copy the original label being edited
const editItem = reactive({
    label: props.tileItem.label
});


const emits = defineEmits( [
  // REQUIRED; need to specify some events that your
  // component will emit through useDialogPluginComponent()
  ...useDialogPluginComponent.emits,
]);

// Submit the updated tile item label
const handleSubmit = () =>{
  console.log("EditTileItemLabel.handleSubmit: ")
  // put focus on invalid component
  formRef.value.validate(true)
      .then((isValid:boolean)=>{
        if (isValid) {
          console.info("EditTileItemName.handleSubmit new item label is valid")
          onDialogOK({tileItem:props.tileItem, newLabel:editItem.label})
        } else {
          console.info("EditTileItemName.handleSubmit item label is not valid")
        }
      })
};

</script>

<template>
  <TDialog
      ref="dialogRef"
      title="Edit Tile Item Label"
      @onClose="onDialogCancel"
      @onSubmit="handleSubmit"
      showOk
      showCancel
  >

    <QForm @submit="handleSubmit"
           ref="formRef"
           >
      <QInput v-model="editItem.label"
              autofocus
              :placeholder="defaultLabel"
              id="NewLabel" type="text"
              label="New Label"
              stack-label
      />

      </QForm>

  </TDialog>
</template>