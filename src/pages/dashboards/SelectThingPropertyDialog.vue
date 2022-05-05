<script lang="ts" setup>

import { reactive } from 'vue';
import { useDialogPluginComponent, QCard, QInput, QList, QExpansionItem } from 'quasar';

import TDialog from '@/components/TDialog.vue';
import { TDPropertyAffordance, ThingTD } from '@/data/thing/ThingTD';
import ThingPropertiesTable from '../things/ThingPropertiesTable.vue';
import { consumedThingFactory } from '@/data/protocolbinding/ConsumedThingFactory';
import { stringify } from 'querystring';
import InteractionOutput from '@/data/thing/InteractionOutput';
// inject handlers
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent();

/**
 *  This dialog shows a selection of things and their properties for adding to a dashboard tile
 */
const props = defineProps<{
  /**
   * The things to select from
   */
  things: ThingTD[]

}>()

const emits = defineEmits( [
  // REQUIRED; need to specify some events that your
  // component will emit through useDialogPluginComponent()
  ...useDialogPluginComponent.emits,
]);

const data = reactive({
  // selectedThing: new ThingTD(),
  // selectedProp: TDProperty,
  searchInput: "",
})


const handleThingPropertySelect = (td:ThingTD, propID:string, tdProp:TDPropertyAffordance)=>{
  onDialogOK({td:td, thingID:td.id, propID:propID, tdProp:tdProp})
}

/** Group properties of things into their type
 * Returns a map of property types and the list of properties for display:
 * [
 *   { property type: [
 *     {propName:string, thingID:string, propAffordance:PropertyAffordance}
 *   ]}
 * ]
 */
// const getPropertiesByType = (things:ThingTD[]): string[] => {
//   let typeNames: {[key: string]: any} = {}

//   things.forEach((td:ThingTD)=>{
//     Object.entries(td.properties).forEach(([propName, propAffordance])=>{
//       typeNames[propAffordance.type] = propName
//     })
//   })
//   return Object.keys(typeNames).sort()
// }



</script>

<template>

<TDialog  ref="dialogRef"
  title="Select Thing Property to Add"
  @onClose="onDialogCancel"
  showClose
>
  <QCard>
      <!-- Search to reduce the amount of Things to select from -->
      <QInput label="Search" v-model="data.searchInput"/>
      <QList>
        <!-- Accordion to select a Thing and view its properties. TODO: show by property type (temperature, humidity...) -->
        <QExpansionItem v-for="td in props.things"
          :label="td.publisher + (td.description ? (' - ' + td.description) : '')" 
          :label-lines="1"
          group="tdgroup"
          :caption-lines="1"
          switch-toggle-sides
          :expand-separator="false"
          :content-inset-level="0.5"
        >
          <div style="width:99%">
            <p style="font-size: small; font-style: italic;">ID: {{td.id}}</p>
            
            <ThingPropertiesTable 
              :cThing="consumedThingFactory.consume(td)"
              enable-prop-select
              @onThingPropertySelect="handleThingPropertySelect"
            />

          </div>
        </QExpansionItem>
      </QList>

  </QCard>
</TDialog>

</template>