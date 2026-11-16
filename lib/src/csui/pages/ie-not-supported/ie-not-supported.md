# Internet Explorer Not Supported

Starting from the version 22.3, Internet Explorer has not been supported by Smart UI any more. Products deploying Smart UI have to make sure, that they will not load Smart UI in Internet Explorer unexpectedly.


## Error Page

The typical way of doing that is showing an error page, if Internet Explorer is detected. For example, in the request handler for `/app`:

    if HTTP_HEADERS[User-Agent] ~ /Trident/ then send 301 with Location: /ie-error

The attached page [ie-not-supported.html] should be used for this purpose. Because of the rare usage, it is simple, static and neither customisable, nor localisable. More features may be added later, if requested.

## Distribution

The page is delivered with `csui-src.zip` at the path `pages/ie-not-supported/ie-not-supported.html` for product components using [csui-dependency-installer]. Product components using `ixmk` can consume it with `cs.core.ui` at the path `pkg/CS_CORE_UI/pages/ie-not-supported/ie-not-supported.html`. The file can be preprocessed during copying to the deployment directory, so that the proper product name will be included. The texts included in the distributed file:

| Place                             | Text value                                     |
| --------------------------------- | ---------------------------------------------- |
| The page title                    | Browser not supported - OpenText Content Suite |
| The text next to the company logo | Content Suite                                  |

For example, copying the file and replacing the texts during the build of Documentum:

    # page title
    sed 's/Browser not supported - OpenText Content Suite/Browser not supported - OpenText Documentum/' \
      input/ie-not-supported.html > output/ie-not-supported.html
    # text next to the company logo
    sed -i 's/Content Suite/Documentum/' output/ie-not-supported.html

## Localisation

Although most products will not localise this page, they might decide to do it later. For example, how to produce `cs/ie-not-supported.html` with the Czech localisation:

    # page langauge
    sed 's/lang="en"/lang="cs"/' input/ie-not-supported.html > cs/ie-not-supported.html
    # page title
    sed 's/Browser not supported - OpenText Content Suite/Nepodporový prohlížeč - OpenText Documentum/' \
      input/ie-not-supported.html > output/ie-not-supported.html
    # primary message text
    sed -i 's/Browser not supported/Tento prohlížeč není podporován./' \
      cs/ie-not-supported.html
    # primary message text
    sed -i 's/Please use a compatible browser/Používejte moderní prohlížeč, prosím./' \
      cs/ie-not-supported.html


[ie-not-supported.html]: ./ie-not-supported.html
[csui-dependency-installer]: https://gitlab.otxlab.net/smartui/tools/csui-dependency-installer
