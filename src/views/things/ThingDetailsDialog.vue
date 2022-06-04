<script lang="ts" setup>

/**
 * 
 */
import TDialog from '@/components/TDialog.vue'
import ThingDetailsView from './ThingDetailsView.vue'
import {ThingTD} from "@/data/thing/ThingTD";
import {useRouter} from "vue-router";
// import { ConsumedThing } from '@/data/thing/ConsumedThing';
import { thingFactory} from '@/data/protocolbinding/ThingFactory';
import { ConsumedThing } from '@/data/thing/ConsumedThing';
import { ref } from 'vue';

/**
 * View ThingTD details dialog
 * @param td: ThingTD document to view
 * @param returnTo: navigation to return on close
 */
const props = defineProps<{
  /** Thing TD to view */
  thingID: string,
  /** Route to go to on close */
  returnTo: string|object,
}>()
// const emit = defineEmits(["onClosed"])

const router = useRouter()

const handleClosed = (ev:any) => {
  if (props.returnTo) {
    router.push(props.returnTo)
  }
}

const cThing = thingFactory.consumeWithID(props.thingID)

// Get the thing of the given ID or an empty TD if the ID is not found
const getHeight = (td: ThingTD | undefined): string => {
  if (!td) {
    return "100px"
  }
  // the height should ideally accommodate the tallest view. However we don't know what that is.
  // so, just estimate based on nr of attributes and configuration.
  let attrCount = ThingTD.GetAttributeNames(td).length
  let configCount = ThingTD.GetConfigurationNames(td).length
  // row height is approx 29px + estimated header and footer size around 300px
  let height = Math.max(attrCount, configCount) * 29 + 340;
  return height.toString() + 'px'
}

</script>

<template>

  <TDialog :visible="true" :title="cThing.td.description" @onClosed="handleClosed" showClose
    :height="getHeight(cThing.td)" minHeight="40%" minWidth="600px">

    <ThingDetailsView v-if="props.thingID" :cThing="cThing" />

  </TDialog>

</template>
