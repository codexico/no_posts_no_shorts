# No Posts No Shorts for YouTube

**Uma extensão leve e focada em performance para recuperar sua experiência no YouTube.**

---

### 🚀 Status do Projeto

- **Manifest V3**: Seguindo os padrões mais recentes de segurança e eficiência.

- **Firefox Mobile Ready**: Otimizado para dispositivos Android.

- **Zero Data Collection**: Privacidade total para o usuário.

---

## 📖 Sobre o Projeto

Esta extensão foi otimizada especialmente para o **Firefox Mobile (Android)**, corrigindo o bug de scroll que ocorre no modo paisagem devido à renderização de elementos de Posts da Comunidade.

O **No Posts No Shorts for YouTube** também remove dinamicamente as prateleiras de "Shorts".

---

## ✨ Principais Recursos

- **Ocultação Pura**: Remove elementos de Shorts e Posts sem quebrar o layout da página.

- **Otimização Mobile**: Garante uma interface fluida e estável em dispositivos Android.

- **Performance Baseline**: Utiliza seletores CSS modernos (`:has`) e `MutationObserver` eficiente para garantir baixo consumo de CPU e bateria.

- **Privacidade Total**: Não requer permissões de histórico e não se comunica com servidores externos.

---

## 🛠️ Tecnologias Utilizadas

- **Manifest V3**

- **Web-Ext CLI**

- **CSS Level 4** (seletores relacionais)

---

## 🛡️ Notas de Privacidade

Esta extensão é de código aberto e **não coleta nenhum dado do usuário**

Funciona inteiramente no lado do cliente, modificando apenas a apresentação visual (DOM/CSS) da página do YouTube para o próprio usuário.

## Development

https://extensionworkshop.com/documentation/develop/developing-extensions-for-firefox-for-android/

To test on android emulator:

Download the _-x86_64.apk_ for the (latest?) android version of Firefox Nightly: https://ftp.mozilla.org/pub/fenix/releases/{150.0.3}/android/fenix-{150.0.3}-android-x86_64/

Install by dragging the apk to the emulator (must first activate the developer permissions)

To test on device, install the Firefox Nightly from the Play Store.

Install web-ext https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/

Then run one of this commands:

```sh
cd extension
web-ext run --target=firefox-android --android-device=emulator-5554 --firefox-apk=org.mozilla.fenix --adb-remove-old-artifacts
web-ext run --target=firefox-android --android-device=emulator-5554 --firefox-apk=org.mozilla.firefox_beta --adb-remove-old-artifacts
web-ext run --target=firefox-android --android-device=3C181JEKB07027 --firefox-apk=org.mozilla.firefox --adb-remove-old-artifacts
```

Use the firefox devtools from the computer to debug the extension:

https://firefox-source-docs.mozilla.org/devtools-user/about_colon_debugging/index.html#connecting-to-a-remote-device

**Build:**

```sh
cd extension
web-ext build -a ../web-ext-artifacts
```

**Update on firefox store:**

```sh
cd extension
web-ext sign --api-key <your-api-key> --api-secret <your-api-secret> --channel listed
```
