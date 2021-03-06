<script lang="ts" setup>

/** Edit Tile Dialog
 * Edit the tile name, type and select thing properties to display
 */

import {ref, reactive} from "vue";
import {cloneDeep as _cloneDeep, remove as _remove} from 'lodash-es'
import {useDialogPluginComponent, useQuasar, QCheckbox, QForm, QInput, QSelect} from "quasar";
import {matAdd} from "@quasar/extras/material-icons";

import TDialog from "@/components/TDialog.vue";
import TButton from "@/components/TButton.vue";

import { DashboardTileConfig, IDashboardTileItem, TileTypeCard, TileTypeImage } from "@/data/dashboard/DashboardStore";
import SelectThingPropertyDialog from "./widgets/SelectThingPropertyDialog.vue";
import TileItemsTable from "./widgets/TileItemsTable.vue";
import EditTileItemLabel from "./widgets/EditTileItemLabel.vue";
import { thingFactory } from "@/data/protocolbinding/ThingFactory";

const $q = useQuasar()

// inject dialog handlers
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent();

const props = defineProps<{
  title: string,
  tile?: DashboardTileConfig,
}>()

const formRef = ref()

// editTile is a copy the tile being edited or empty on add
const editTile:DashboardTileConfig = reactive<DashboardTileConfig>(
    props.tile ? _cloneDeep(props.tile) : new DashboardTileConfig()
);

const emits = defineEmits( [
  // REQUIRED; need to specify some events that your
  // component will emit through useDialogPluginComponent()
  ...useDialogPluginComponent.emits,
]);


// Popup a selection dialog to add a thing's property to the tile
const handleAddThingProperty = () => {
  console.info("EditTileDialog.handleAddTileProperty: Showing the add tile property dialog")
  $q.dialog({
     component: SelectThingPropertyDialog,
     componentProps: {
      //  tile: editTile,
       things: thingFactory.thingStore.all,
      },
  }).onOk( (props)=>{
    let thingID=props.thingID
    let propID=props.propID
    // Add a new view property to the tile
    console.log("EditTileDialog.handleAddTileProperty: props:", props)
    
    editTile.items.push({thingID: thingID, propertyName: propID })
    })
    .onCancel(()=>{
      console.log("EditTileDialog.handleAddTileProperty closing")
    })
}

// Popup a dialog for editing the selected tile item label
const handleEditTileItemLabel = (tileItem:IDashboardTileItem, defaultLabel:string) => {
  console.info("EditTileDialog.handleEditTileItemLabel")
  $q.dialog({
     component: EditTileItemLabel,
     componentProps: {
      //  tile: editTile,
       defaultLabel: defaultLabel,
       tileItem: tileItem,
      },
  }).onOk( (props)=>{
    // let tileItem:IDashboardTileItem = props.tileItem
    let newLabel:string = props.newLabel
    // Add a new view property to the tile
    console.log("EditTileDialog.handleEditTileItemLabel: props:", props)
    tileItem.label = newLabel
  })
}

// Remove the tile item from the list of items
const handleRemoveTileItem = (tileItem:IDashboardTileItem) => {
  console.info("EditTileDialog.handleRemoveTileItem. item=",tileItem)
  _remove(editTile.items, (item) => (item.propertyName === tileItem.propertyName && (item.thingID === item.thingID)))
}

// Submit the updated Tile
const handleSubmit = () =>{
  console.log("EditTileDialog.handleSubmit: ", editTile)
  // put focus on invalid component
  formRef.value.validate(true)
      .then((isValid:boolean)=>{
        if (isValid) {
          console.info("EditTileDialog.handleSubmit tile is valid: ", editTile)
          onDialogOK(editTile)
        } else {
          console.info("EditTileDialog.handleSubmit tile is not valid")
        }
      })
};


</script>

<template>
  <TDialog
      ref="dialogRef"
      :title="props.title"
      @onClose="onDialogCancel"
      @onSubmit="handleSubmit"
      showOk
      showCancel
  >

    <QForm @submit="handleSubmit"
           ref="formRef"
           >
      <QInput v-model="editTile.title"
              :autocomplete="TileTypeCard"
              required autofocus
              id="title" type="text"
              label="Title"
              :rules="[()=>editTile.title !== ''||'Please provide a title']"
              stack-label
      />
      <div class="row">
        <QSelect label="Type of tile"
            class="col" 
            v-model="editTile.type"
            map-options  emit-value
            :options="[
                    {label:'Card', value:TileTypeCard},
                    {label:'Image', value:TileTypeImage}]"
            :rules="[(val:any)=> 
                      (!!val && (val.length > 0)) || 
                          'please select a valid type: '+val
                          ]"

            
        />
        <QCheckbox label="Show Type" 
          class="col" 
          v-model="editTile.showType"
        >
        </QCheckbox>
      </div>
      <p>Properties 
        <TButton round flat 
                 :icon="matAdd" 
                 tooltip="Add property to tile"
                 @click="handleAddThingProperty"
        />
      </p>
      <TileItemsTable v-if="editTile.items"
        :tileItems="editTile.items"
        dense flat
        edit-mode
        :noTypeCol="!editTile.showType"
        @onRemoveTileItem="handleRemoveTileItem"  
        @onEditTileItem="handleEditTileItemLabel"
        :thingFactory="thingFactory"
        />
      <div v-else>Missing dashboard tile items</div>
    </QForm>

  </TDialog>
</template>

<style scoped>
</style>


<style>

/** follow app/dialog font size rules */
.q-field {
  font-size: inherit !important;
}
</style>