<script lang="ts" setup>

/**
 * Dashboard Tile Card that presents a single text value including
 * indicators of the value age, min, max and average.
 */
import {useQuasar, QLinearProgress, QBadge, QToggle} from "quasar";
import {DashboardTileConfig, IDashboardTileItem} from "@/data/dashboard/DashboardStore";
import { ThingFactory } from "@/data/protocolbinding/ThingFactory";
import { currentTime } from "@/data/timeAgo";
import { ref } from "vue";

const $q = useQuasar()

const props= defineProps<{
  tile:DashboardTileConfig
  tileItem: IDashboardTileItem
  // value: InteractionOutput
  thingFactory: ThingFactory
}>()


// computed values
const cThing = ref(props.thingFactory.consumeWithID(props.tileItem.thingID))
const propIO = ref(cThing.value?.properties.get(props.tileItem.propertyName))
const tdProp = ref(cThing.value?.td.properties[props.tileItem.propertyName])

/**
 * Lookup the property value of a tile item 
 */
const getThingPropValue = (tileItem:IDashboardTileItem):string => {
  if (!propIO?.value || !cThing?.value) {
    return "Missing value"
  } else if (!tdProp?.value) {
    return "N/A"
  }
  let valueStr = propIO.value.value + " " + (tdProp.value.unit ? tdProp.value.unit:"")
  return valueStr
}
/**
 * Lookup the property age of a tile item 
 */
const getPropAge = (tileItem:IDashboardTileItem):string => {
  if (!propIO?.value ) {
    return "n/a"
  }
  let valueStr = propIO.value.getUpdatedShortText()
  return valueStr
}

/**
 * Lookup the property age fraction of 12 hours (0..1)
 * This is a computed function that uses 'currentTime' to periodically auto-update the age
 * Intended to show an 'age bar'.
 */
const getAgeFractionOfDay = (tileItem:IDashboardTileItem):number => {
  if (!propIO?.value ) {
    return 0
  }
  let age = currentTime.value.diff(propIO.value.updated, 'seconds')
  let ageFraction = age.seconds / (12*3600)
  return ageFraction
}

/**
 * Trigger the action to toggle the switch
 */
const switchAction = () => {
  let actionName = props.tileItem.propertyName
  console.log("Trigger toggle action")
  $q.notify({type:'positive', message: "Requested toggle of "+actionName })
  cThing.value?.invokeAction(actionName, !propIO?.value)
}

</script>

<template>
  <div>
    <p v-show="props.tile.showType" class="item-type">
      {{props.tileItem.propertyName}}
    </p>

    <p class="card-value single-item-card">
      <div v-if="tileItem.propertyName=='relay'">
        <QToggle :modelValue="propIO?.asBoolean"
          @click="switchAction"
        >
          {{propIO?.asBoolean ? "On" : "Off"}}
        </QToggle>
      </div>
      <div v-else>
        {{getThingPropValue(props.tileItem)}}
      </div>
    </p>

    <q-linear-progress 
      size="25px" color="red" track-color="blue"
      :value="getAgeFractionOfDay(props.tileItem)" >

      <div class="absolute-full flex flex-center">
        <q-badge color="white" text-color="teal" 
        :label="getPropAge(props.tileItem)" 
        />
      </div>
    </q-linear-progress>
  </div>
</template>

<style scoped>
.item-type {
  margin-bottom: 0;
  font-size: 0.9em;
  font-style: italic; 
}
.card-value {
  flex-grow: 1;
  display:flex;
  flex-direction: column;
  justify-content: center;
  margin: 0;
}

.single-item-card {
  font-size: 1.2rem;
  font-weight: bold;
}
</style>