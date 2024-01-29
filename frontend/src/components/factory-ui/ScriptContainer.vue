<script setup lang="ts">
import type { IModelScripting, ISystemProperty, IUserProperty } from '@/types/backendTypes';
import { getAllSystemProperties, getAllUserProperties, getScriptingContent } from '@/utils/backend-communication/getRequests';
import * as monaco from 'monaco-editor';
import { onMounted, onBeforeUnmount, ref, type Ref } from "vue";

const containerRef = ref(null);
let editor: monaco.editor.IStandaloneCodeEditor;

const props = defineProps({ 
  model: {
    type: Object as () => IModelScripting,
    required: true
  }
})
const scriptContent = ref("#Here u put in the machine to script as an object")
const systemProperties: Ref<ISystemProperty[]> = ref([])
const userProperties: Ref<IUserProperty[]> = ref([])


onMounted(() => {

  // fetch scriptContent, systemProperties and userProperties

  getScriptingContent(props.model.id).then((scriptingContent) => {
    console.log("___SCRIPTING CONTENT___: ", scriptingContent);
    if(scriptingContent != "") {  // show default text, if nothing in DB
      scriptContent.value = scriptingContent.toString();
      editor.setValue(scriptContent.value); 
    }
    console.log(scriptContent.value)
  })
  
  getAllSystemProperties(props.model?.id).then((json) => {
    systemProperties.value = json
    console.log(json)
  })

  getAllUserProperties(props.model?.id).then((json) => {
    userProperties.value = json
    console.log(json)
  })


  if (containerRef.value) {
    editor = monaco.editor.create(containerRef.value, {
      value: scriptContent.value,
      language: "python",
      lineNumbers: "off",
      roundedSelection: false,
      scrollBeyondLastLine: false,
      readOnly: false,
      theme: "vs-dark",
      minimap: { enabled: false }
    });

    setTimeout(() => {
      editor.updateOptions({
        lineNumbers: "on",
      });
    }, 2000);

  }

});

onBeforeUnmount(() => {
  if (editor) {
    editor.dispose();
  }
});

</script>

<template>
  <div ref="containerRef" class="scriptDiv">
    <div class="saveBtn">
      <button @click="$emit('saveAndClose', editor.getValue())" type="button" class="focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 m-3 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800">Script absetzen</button>
      <button @click="$emit('closeScript')" type="button" class="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 m-3 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900">Abbrechen</button>
    </div> 
    <div class="propertiesDiv">
      <div class="userProperties">
        <h4>User Properties</h4>
        <p class="userPropertyValues" v-for="userProperty in userProperties">{{ userProperty.property }} =  {{ userProperty.value }}</p>
      </div>
      <div class="systemProperties">
        <h4>System Properties</h4>
        <p class="systemPropertyValues" v-for="systemProperty in systemProperties">{{ systemProperty.property }} =  {{ systemProperty.value }}</p>
      </div>
  </div>
  </div>
</template>

<style scoped>
.scriptDiv {
  display: flex;
  width: 800px;
  height: 600px;
  position: fixed;
  top: 50%;
  left: 42.5%;
  transform: translate(-50%, -50%);
  border: 1.5px solid grey;
}

.saveBtn {
  width: 800px;
  height: 65px;
  position: fixed;
  top: 95.75%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  justify-content: space-between;
  z-index: 1;
}
.propertiesDiv{
  position: fixed;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 600px;
  width: 300px;
  left: 105%;
}
.userProperties{
  background-color: #1E1E1E;
  height: 290px;
  width: 100%;
  border: 1.5px solid grey;
}
.userProperties h4{
  margin: 0.5rem;
  padding-bottom: 0.75rem;
}

.userPropertyValues {
  margin: 0.5rem;
}
.systemProperties{
  background-color: #1E1E1E;
  width: 100%;
  height: 290px;
  top: 50%;
  border: 1.5px solid grey;
}
.systemProperties h4{
  margin: 0.5rem;
  padding-bottom: 0.75rem;
}

.systemPropertyValues {
  margin: 0.5rem;
}
</style>