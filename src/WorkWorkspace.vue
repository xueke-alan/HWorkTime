<script setup lang="ts">
import SummarySidebar from "./workspace/SummarySidebar.vue";
import CalendarPanel from "./workspace/CalendarPanel.vue";
import WorkEditor from "./workspace/WorkEditor.vue";
import WorkspaceDialogs from "./workspace/WorkspaceDialogs.vue";
</script>
<template>
  <main class="wrap">
    <div class="workspace">
      <SummarySidebar /><CalendarPanel /><WorkEditor />
    </div>
  </main>
  <WorkspaceDialogs />
</template>
