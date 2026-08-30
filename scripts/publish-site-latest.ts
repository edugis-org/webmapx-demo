/**
 * Brings webmapx.com up to date with the newest code and the newest configs.
 *
 * "Latest" spans three repositories, and only what has been *pushed* counts:
 *
 *   webmapx-configs  the config content
 *   webmapx          the code
 *   webmapx-demo     the landing page, the workflow that assembles the site,
 *                    and site.lock — the commits of webmapx and webmapx-configs
 *                    this site is built from
 *
 * The pin lives here rather than in webmapx because pinning is a publication
 * decision and this is what publishes; webmapx is where the code is built, and
 * its own Pages deploy is a preview that follows the configs as they are.
 *
 * That also makes this script's last step its own trigger: the site is built by
 * this repository's workflow `on: push`, so pushing the updated pin *is* the
 * publication. There is no button to press afterwards.
 *
 * Order matters. A pin naming a commit that was never pushed cannot be fetched
 * by the build, so the configs are pushed first, then the code, and the pin
 * naming those configs goes last.
 *
 * The script pushes, and commits site.lock — a generated file whose commit
 * *is* the publication. It never commits anything else: code someone is still
 * working on is not published by accident, it stops and says so instead.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const HERE = path.resolve(import.meta.dirname, '..');
const WEBMAPX = path.resolve(HERE, '..', 'webmapx');
const CONFIGS = path.resolve(HERE, '..', 'webmapx-configs');
const LOCK = path.join(HERE, 'site.lock');
const CONFIGS_URL = 'https://github.com/edugis-org/webmapx-configs.git';
const WEBMAPX_URL = 'https://github.com/edugis-org/webmapx.git';

interface Pin {
    repository: string;
    commit: string;
}

interface SiteLock {
    configs: Pin;
    webmapx: Pin;
    publishedAt: string;
}

function git(cwd: string, args: string[]): string {
    return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function run(cwd: string, file: string, args: string[]): void {
    execFileSync(file, args, { cwd, stdio: 'inherit' });
}

function stop(lines: string[]): never {
    for (const line of lines) console.error(line);
    process.exit(1);
}

/**
 * Pushes a repository's main branch if it is ahead, and refuses to go on if it
 * is in a state a push cannot fix. Returns the commit the remote ends up at,
 * which is what the build will actually see.
 *
 * `allowDirty` is for this repository, whose site.lock is about to change:
 * its own dirtiness is checked separately, since one specific file may differ.
 */
function pushMain(name: string, dir: string, allowDirty = false): string {
    if (!existsSync(path.join(dir, '.git'))) {
        stop([`${name}: no clone at ${dir}.`,
              'All three repositories must sit side by side for this to work.']);
    }

    const branch = git(dir, ['rev-parse', '--abbrev-ref', 'HEAD']);
    if (branch !== 'main') {
        stop([`${name}: on branch ${branch}, not main.`,
              'The site is built from main, so publishing from another branch would',
              'ship something other than what you are looking at.']);
    }

    if (!allowDirty && git(dir, ['status', '--porcelain']).length > 0) {
        stop([`${name}: uncommitted changes.`,
              'Commit them (or stash them) first — a push cannot carry them, so they',
              'would silently not be on the site. Deciding what a commit *is* stays',
              'yours; this script only pushes what you have already decided.',
              `  git -C ${dir} status`]);
    }

    git(dir, ['fetch', 'origin', 'main']);
    const [behind, ahead] = git(dir, ['rev-list', '--left-right', '--count', 'origin/main...HEAD'])
        .split(/\s+/).map(Number);

    if (behind > 0) {
        stop([`${name}: ${behind} commit(s) on origin/main that you do not have.`,
              'Someone else pushed. Reconcile first, so you publish a history you have seen.',
              `  git -C ${dir} pull --rebase`]);
    }

    if (ahead > 0) {
        console.log(`${name}: pushing ${ahead} commit(s) …`);
        run(dir, 'git', ['push', 'origin', 'main']);
    } else {
        console.log(`${name}: already pushed.`);
    }

    return git(dir, ['rev-parse', 'HEAD']);
}

/**
 * Writes site.lock, commits it and pushes — which is what starts the build.
 *
 * The lock names both repositories, and that is deliberate: pinning only the
 * configs would leave a code-only release with nothing to commit here, hence no
 * push, hence no rebuild — the exact silence this whole exercise is about.
 * Every publication now changes this file, so every build has a commit saying
 * what went out.
 */
function publishPin(configsHead: string, webmapxHead: string): void {
    const current = JSON.parse(readFileSync(LOCK, 'utf8')) as SiteLock;

    // Anything else uncommitted here is someone's work in progress, and this
    // script does not decide what that is.
    const dirty = git(HERE, ['status', '--porcelain'])
        .split('\n')
        .filter((line) => line.trim().length > 0 && !line.endsWith(' site.lock'));
    if (dirty.length > 0) {
        stop(['webmapx-demo: uncommitted changes other than site.lock.',
              'Commit or stash them first — publishing would otherwise leave the site and',
              'your working copy describing different things.',
              `  git -C ${HERE} status`]);
    }

    const unchanged = current.configs.commit === configsHead && current.webmapx.commit === webmapxHead;
    if (unchanged) {
        console.log(`webmapx-demo: site.lock already names webmapx ${webmapxHead.slice(0, 9)}`);
        console.log(`              and configs ${configsHead.slice(0, 9)} — nothing new to publish.`);
        // Still push: a landing-page commit made by hand is a reason to publish
        // too, and it is the push that builds.
        pushMain('webmapx-demo', HERE);
        return;
    }

    if (current.webmapx.commit !== webmapxHead) {
        console.log(`webmapx-demo: webmapx ${current.webmapx.commit.slice(0, 9)} → ${webmapxHead.slice(0, 9)}`);
    }
    if (current.configs.commit !== configsHead) {
        console.log(`webmapx-demo: configs ${current.configs.commit.slice(0, 9)} → ${configsHead.slice(0, 9)}`);
    }

    const lock: SiteLock = {
        configs: { repository: CONFIGS_URL, commit: configsHead },
        webmapx: { repository: WEBMAPX_URL, commit: webmapxHead },
        publishedAt: new Date().toISOString(),
    };
    writeFileSync(LOCK, `${JSON.stringify(lock, null, 2)}\n`);
    run(HERE, 'git', ['commit', '-m',
        `chore(publish): webmapx ${webmapxHead.slice(0, 9)}, configs ${configsHead.slice(0, 9)}`,
        'site.lock']);
    pushMain('webmapx-demo', HERE, true);
}

function main(): void {
    // Configs first: the pin about to be pushed must name a commit the build can
    // fetch, and a commit is only fetchable once its repository has been pushed.
    const configsHead = pushMain('webmapx-configs', CONFIGS);

    // Then the code, at the commit the build will check out.
    const webmapxHead = pushMain('webmapx', WEBMAPX);

    // And last the pin naming both — whose push is what makes the site rebuild.
    publishPin(configsHead, webmapxHead);

    console.log('');
    console.log('webmapx.com is rebuilding: https://github.com/edugis-org/webmapx-demo/actions');
}

main();
