<template>
  <div class="comment" v-html="comment.body"></div> <!-- @expect CWE-79 -->
  <p>{{ comment.author }}</p>
</template>
