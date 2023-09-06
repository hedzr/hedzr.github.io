# hedzr.github.io

main gh io pages and sites

1. Open this blog at [hedzr.com](https://hedzr.com).
   1. github: <https://github.com/hedzr/hedzr.github.io>

2. The blog site is powered by [Jekyll](https://jekyllrb.com/) & [Minimal Mistakes](https://mademistakes.com/work/minimal-mistakes-jekyll-theme/).  
   Read its doc [here](https://mmistakes.github.io/minimal-mistakes/docs/quick-start-guide/)

3. ~~mkdocs template repo for your notes, blog, or docs-site: [notes-hi](./notes-hi/)~~
4. More
5. Special [hedzr/hedzr](https://github.com/hedzr/hedzr)

## Run at local

First thing is install and prepare Gems environment by install gems packages:

```bash
bundle
# Or bundle update
# Or bundle install
```

The second step is start a local server to serve for Jekyll Pages:

```bash
bundle exec jekyll serve --verbose --drafts --watch --host 0.0.0.0 --port 3999
```

And open <http://localhost:3999/> at browser.

> To install jekyll to local machine, see its [Installation](https://jekyllcn.com/docs/installation/) chapter.
