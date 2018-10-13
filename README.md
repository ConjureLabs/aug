# aug

`aug` augments a project. It layers files from one directory onto another.

```
$ aug --help

Usage: aug --src=<src-dir> --apply=<apply-dir> --dest=<dest-dir>

Options:
  --src, -s =<src-dir>          Base project directory being augmented
  --apply, -a =<apply-dir>      Directory that will augment the src directory
  --dest, -d =<dest-dir>        Path to where augmented version of project should copy to
  --dry-run                     Does not write to destination, and only logs what would have been written
  --help, -h                    List commands and options
  --version, -v                 Display installed version
```

## Purpose

Imagine you have a web app that you want to open source, but you want to offer a hosted version as well. The hosted version may have some differences, like a different landing page, onboarding, and billing. You probably want the open source version to be simple.

This becomes difficult since it may mean maintaining a fork of the open source app. So, you end up with parallel apps that get out of sync.

`aug` attempts to fix this problem by allowing you to extend and override the open source app as needed. It takes in a source directory (the open source project), an 'apply' directory (the extensions and overrides), and destination (where a merged project will be copied to).

The 'apply' directory should only contain files you want to override with. For example, if you you only want to change the landing page, then the 'apply' directory should contain the landing page file. The path to this file needs to match the page in the src directory.

`aug` will walk each directory, and create symlinks to the corresponding files. 'apply' files are *always preferred* over src files.

## .augignore

You can add an `.augignore` file to either project, in any directory. This ignore file follows the same logic as a `.gitignore` file. You can specify files and folders that you do not want carried over in the merge process.


```
# ignore .git resources
.git

# MacOS
.DS_Store
```
