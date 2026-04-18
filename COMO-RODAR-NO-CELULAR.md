# Rodar o projeto no celular

Quando acessar pelo IP da rede (ex.: `http://192.168.1.233:8080`) não funcionar, use um **túnel** para gerar um link que abre no celular (funciona em qualquer rede).

## Opção 1: ngrok (recomendado)

1. **Baixar o ngrok**  
   - Acesse: https://ngrok.com/download  
   - Baixe a versão para Windows e descompacte (ex.: na pasta `Downloads`).

2. **Cadastro gratuito (opcional)**  
   - Crie uma conta em https://ngrok.com e pegue seu authtoken.  
   - No PowerShell, na pasta do ngrok:  
     `.\ngrok config add-authtoken SEU_TOKEN`

3. **Subir o projeto**  
   - Em um terminal, na pasta do projeto:  
     `npm run dev`  
   - Deixe rodando.

4. **Abrir o túnel**  
   - Em **outro** terminal, vá até a pasta do ngrok e rode:  
     `.\ngrok http 8080`  
   - Vai aparecer uma URL tipo:  
     `https://abc123.ngrok-free.app`

5. **No celular**  
   - Abra o navegador e acesse essa URL (pode ser em qualquer rede, 4G ou outro Wi‑Fi).

---

## Opção 2: localtunnel (sem instalar programa)

1. Instale uma vez no PC:  
   `npm install -g localtunnel`

2. Com o projeto rodando (`npm run dev`), em outro terminal:  
   `npx localtunnel --port 8080`

3. Vai aparecer algo como:  
   `your url is: https://algum-nome.loca.lt`  
   Use essa URL no celular.

---

## Se ainda não funcionar

- **Firewall do Windows:** permitir a porta 8080 para “Rede privada”.  
- **Antivírus:** verificar se não está bloqueando o servidor ou o ngrok/localtunnel.
