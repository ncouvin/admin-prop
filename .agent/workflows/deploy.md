---
description: Pipeline de Deploy a Vercel/GitHub
---
# Reglas OBLIGATORIAS para el despliegue

1. **Sumar la Versión:** SIEMPRE que se haga un `git commit` y se termine una etapa, debes editar obligatoriamente `package.json` y/o `src/version.ts` (u otros archivos de metadata) para sumar 1 versión (ej. pasar de `v0.10.0` a `v0.11.0`). El cambio debe reflejarse visualmente en la pantalla para que el usuario sepa que interactúa con la versión correcta. NO omitir este paso nunca.
   
2. **Separación de Comandos PowerShell:** El usuario opera en Windows y usa `powershell`. El token `&&` NO ES VÁLIDO EN ESTA VERSIÓN. Si intentas encadenar comandos en PowerShell (ej: `npm run build && git add .`), tu ejecución va a fallar SIEMPRE con `InvalidEndOfLine`. 
   
   **SOLUCIÓN:** Usa exclusivamente punto y coma (`;`) para separar comandos secuenciales.
   - **Incorrecto:** `npm run build && git commit -a -m "msg" && git push`
   - **Correcto:** `npm run build; git add .; git commit -m "msg"; git push origin master`

Esta regla es crítica para evitar fallos de compilación masivos. Guía tus pasos con esta premisa.
