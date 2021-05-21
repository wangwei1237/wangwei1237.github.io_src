#!/bin/bash

if [ $# -ne 1 ]
then
    echo "::error the parameters error, please check!!!"
    exit 1
fi

ROOT_PATH=$1

BOOKS=('chaos-engineering' 
'digital_video_concepts' 
'temperature-of-the-idioms' 
'monolith-to-microservices' 
'discovery-the-unpredictable-risk' 
'Kubernetes-in-Action-Second-Edition')

mkdir -p ${ROOT_PATH}/books && cd ${ROOT_PATH}/books
URL=""
DOWNLOAD_URL=""

for ((i=0; i <${#BOOKS[@]}; i++))
do
    echo build book: ${BOOKS[i]}
    if [ "${BOOKS[i]}" = "monolith-to-microservices" ]
    then
        URL="https://api.github.com/repos/wangwei1237/${BOOKS[i]}/releases/latest"
        DOWNLOAD_URL=$(curl -H "Accept: application/vnd.github.v3+json" $URL | grep "${BOOKS[i]}.tar.gz" | grep 'browser_download_url' | cut -d'"' -f4)
        wget $DOWNLOAD_URL --no-check-certificate && tar xzvf ${BOOKS[i]}.tar.gz
    fi

    /bin/cp -f $ROOT_PATH/${BOOKS[i]}/release/${BOOKS[i]}.tar.gz . && tar xzvf ${BOOKS[i]}.tar.gz

    #For the bugs of the gitbook, we can not build books with gitbook cmd.
    #cd $ROOT_PATH/${BOOKS[i]}
    #
    #gitbook install 
    #
    #if [ "${BOOKS[i]}" = "monolith-to-microservices" ]
    #then
    #    /bin/cp -rf misc/gitbook-plugin-hints/* node_modules/gitbook-plugin-hints/
    #    /bin/cp -rf misc/tbfed-pagefooter_index.js node_modules/gitbook-plugin-tbfed-pagefooter/index.js
    #fi
    #
    #if [ "${BOOKS[i]}" = "digital_video_concepts" -o ""${BOOKS[i]}"" = "temperature-of-the-idioms" ]
    #then
    #    /bin/cp -rf misc/tbfed-pagefooter_index.js node_modules/gitbook-plugin-tbfed-pagefooter/index.js
    #fi
    #
    #gitbook build
    #
    #/bin/cp -rf _book $ROOT_PATH/books/${BOOKS[i]}
done
