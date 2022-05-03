<script lang="ts" setup>

import {ref} from 'vue'
import { date, QCard, QCardSection, QField, QForm, QTab, QTabs, QTabPanel, QTabPanels } from 'quasar';

import {matSettings, matSettingsRemote, matDescription, matDirectionsRun} from '@quasar/extras/material-icons'


import {ThingTD, TDPropertyAffordance, TDActionAffordance, TDEventAffordance} from '@/data/thing/ThingTD';

import ThingEvents from './ThingEvents.vue'
import ThingActions from "@/pages/things/ThingActions.vue";
import ThingPropertiesTable from "@/pages/things/ThingPropertiesTable.vue";
import ThingConfiguration from "@/pages/things/ThingConfiguration.vue";
import { ConsumedThing } from '@/data/thing/ConsumedThing';


const {formatDate}= date

// Consumed Thing Details View
const props = defineProps<{
  cThing: ConsumedThing,
  height?: string,
}>()

const selectedTab = ref('attr')


// Convert iso9601 date format to text representation 
const getDateText = (iso:string): string => {
  let timeStamp = new Date(iso)
  return formatDate(timeStamp, "ddd Do MMM YYYY HH:mm:ss (Z)")
}

</script>

<template>
  <div style="display: flex; flex-direction: column; overflow: auto; width: 100%; height: 100%">

  <QForm  class='row q-pb-sm'>
    <QField label="Thing ID" stack-label dense class="q-pl-md">
      {{props.cThing.id}}
    </QField>
    <QField  label="Created" stack-label dense class="q-pl-md">
      <!-- {{props.td.created}}  -->
      {{getDateText(props.cThing.td.created)}}
    </QField>
  </QForm>

    <QTabs horizontal align="left" v-model="selectedTab" >
      <QTab label="Attributes" :icon="matDescription" name="attr"/>
      <QTab label="Configuration" :icon="matSettings" name="config"/>
      <QTab label="Thing Events" :icon="matSettingsRemote" name="events"/>
      <QTab label="Thing Actions" :icon="matDirectionsRun" name="actions"/>
    </QTabs>

    <QTabPanels v-model="selectedTab">
      <QTabPanel name="attr"  class="q-pa-xs">
        <ThingPropertiesTable 
          :cThing="props.cThing"
          :propNames="ThingTD.GetAttributeNames(props.cThing.td)"
          :noDataLabel='"Thing "+props.cThing.td.description+"\" has no properties"'
        /> 
      </QTabPanel>

      <QTabPanel name="config" class="q-pa-xs">
        <ThingConfiguration :cThing="props.cThing"/>
      </QTabPanel>

      <QTabPanel name="events" class="q-pa-xs">
        <ThingEvents :cThing="props.cThing"/>
      </QTabPanel>

      <QTabPanel name="actions" class="q-pa-xs">
        <ThingActions :cThing="props.cThing"/>
      </QTabPanel>

    </QTabPanels>
  </div>
</template>
