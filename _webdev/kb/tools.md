---
# permalink: /web-dev/
title: "Web Developing KB"
last_modified_at: 2023-02-22
toc: true
sidebar:
  nav: sidebar-meta
header:
  teaser: https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/Artificial-Intelligence-5.jpg
  image: https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/Artificial-Intelligence-5.jpg
---

## Leading Pages

- [Mirror-list](https://github.com/hedzr/mirror-list): About the mirrors, accelerators for China users, etc.



## NodeJS Environment Managers

1. NVM, [Node Version Manager](https://github.com/nvm-sh/nvm)
2. [N](https://github.com/tj/n)
3. FNM, [Fast Node Manager](https://github.com/Schniz/fnm)
4. [Volta](https://volta.sh/)
5. [Asdf](https://asdf-vm.com/)

### FNM

```bash
brew install fnm
brew upgrade fnm

fnm ls-remote
fnm ls
fnm install --lts
fnm ls
fnm install 14.13.1
fnm use lts-latest
fnm default lts-latest

# install fnm env to your zsh so that node/npm can be available right now
cat >> $HOME/.zprofile <<EOF
command -v fnm >/dev/null && eval $(fnm env)
EOF

# Start a new zsh shell
zsh

# Now, these following should work:
node -v
npm -v
npm install -g npm
npm install -g yarn
yarn -v
```





## WebFonts Generators

- <https://www.whatfontis.com/Webfont-Generator.html>
- <https://www.fontspace.com/web-font-generator>
- <https://www.creativefabrica.com/webfont-generator/>
- <https://www.fontsquirrel.com/tools/webfont-generator>
- <https://transfonter.org/>
- 









