bundle exec jekyll serve --verbose --drafts --watch --host 0.0.0.0 --port 3999 $*

complex-start() {
  local what="${what:-gh-pages}"
  echo -en "\033]0;start $what\a"

  local ROOT="${ROOT:-$iCloudDrive/Nextcloud.new}"
  local srcdir="$ROOT/KB.work/jekyll.work/hedzr.github.io"
  local dir="$HOME/Downloads/w/hedzr.github.io.work"

  [ -d "$dir" ] || mkdir -pv "$dir"
  rsync -avrztopg --delete --exclude .git/ "$srcdir"/ "$dir"/

  pushd "$dir" >/dev/null

  # which rvm >/dev/null && rvm use 3.2.2 # 2.7
  # fn_exists rbenv && rbenv && echo "rbenv initialized."
  which rbenv >/dev/null && rbenv

  # which bundle >/dev/null || { gem install bundle && bundle --version; }
  # which bundle >/dev/null && {
  # bundle install
  # gem install jekyll

  # optional, uncomment it if bundler: failed to load command: jekyll
  # see also https://stackoverflow.com/questions/69890412/bundler-failed-to-load-command-jekyll
  grep -q 'gem "webrick", ' Gemfile || { gem add webrick && bundle install; }

  bundle exec jekyll serve --verbose --drafts --watch --host 0.0.0.0 --port 3999 $*
  # } || echo "'bundle' command not found!"

  popd >/dev/null
}
