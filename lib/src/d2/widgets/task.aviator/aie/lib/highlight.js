/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "d2/widgets/task.aviator/aie/lib/highlight/highlight-core", "d2/widgets/task.aviator/aie/lib/highlight/languages/bash", "d2/widgets/task.aviator/aie/lib/highlight/languages/java", "d2/widgets/task.aviator/aie/lib/highlight/languages/javascript", "d2/widgets/task.aviator/aie/lib/highlight/languages/json", "d2/widgets/task.aviator/aie/lib/highlight/languages/plaintext", "d2/widgets/task.aviator/aie/lib/highlight/languages/python", "d2/widgets/task.aviator/aie/lib/highlight/languages/typescript", "d2/widgets/task.aviator/aie/lib/highlight/languages/xml", "d2/widgets/task.aviator/aie/lib/highlight/languages/yaml", "css!d2/widgets/task.aviator/aie/lib/highlight/styles/github" ], function(hljs, bash, java, javascript, json, plaintext, python, typescript, xml, yaml) {
  hljs.registerLanguage("bash", bash);
  hljs.registerLanguage("html", xml);
  hljs.registerLanguage("java", java);
  hljs.registerLanguage("javascript", javascript);
  hljs.registerLanguage("json", json);
  hljs.registerLanguage("plaintext", plaintext);
  hljs.registerLanguage("python", python);
  hljs.registerLanguage("typescript", typescript);
  hljs.registerLanguage("xml", xml);
  hljs.registerLanguage("yaml", yaml);
  return hljs;
});