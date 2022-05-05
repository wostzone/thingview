<script lang="ts" setup>

// popup view displaying information about a property value
import { QCard, QCardSection, QForm, QField, QSeparator } from 'quasar';
import { ConsumedThing } from '@/data/thing/ConsumedThing';
import { timeAgo } from '@/data/timeAgo';

const props= defineProps<{
  cThing?: ConsumedThing,
  propName: string
}>()

</script>


<template>

  <QForm style="background-color: blanchedalmond; padding:3px" >
    <QField label="Thing ID" stack-label dense >
      {{props.cThing.id}}
    </QField>
    <QField label="Thing Name" stack-label dense>
      {{props.cThing.td.description + " ("+props.cThing?.td.deviceType+")" }}
    </QField>
    <QField  label="Property Name" stack-label dense >
      <!-- {{getDateText(props.cThing.td.created)}} -->
      {{props.propName}}
    </QField>
    <QField  label="Property Value" stack-label dense>
      {{props.cThing?.properties.get(props.propName)?.value}}
    </QField>
    <QField  label="Last updated" stack-label dense >
      {{props.cThing?.properties.get(props.propName)?.getUpdatedShortText()}} 
       (
      {{timeAgo(props.cThing?.properties.get(props.propName)?.updated)}}
      )
    </QField>
    
  </QForm>

</template>
