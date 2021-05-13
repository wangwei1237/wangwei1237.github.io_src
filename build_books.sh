#!/bin/bash

if [ $# -ne 1 ]
then
    echo "::error the parameters error, please check!!!"
    exit 1
fi

ROOT_PATH=$1

mkdir -p ${ROOT_PATH}/books

BOOKS=('chaos-engineering' 
'digital_video_concepts' 
'temperature-of-the-idioms' 
'monolith-to-microservices' 
'discovery-the-unpredictable-risk' 
'Kubernetes-in-Action-Second-Edition')

cd /opt/hostedtoolcache/node/14.16.1/x64/lib/node_modules/gitbook-cli/node_modules/npm/node_modules && npm install graceful-fs@latest --save

for ((i=0; i <${#BOOKS[@]}; i++))
do
    echo build book: ${BOOKS[i]}
    
    cd $ROOT_PATH/${BOOKS[i]}
    
    gitbook install 
    
    if [ "${BOOKS[i]}" = "monolith-to-microservices" ]
    then
        /bin/cp -rf misc/gitbook-plugin-hints/* node_modules/gitbook-plugin-hints/
        /bin/cp -rf misc/tbfed-pagefooter_index.js node_modules/gitbook-plugin-tbfed-pagefooter/index.js
    fi

    if [ "${BOOKS[i]}" = "digital_video_concepts" -o ""${BOOKS[i]}"" = "temperature-of-the-idioms" ]
    then
        /bin/cp -rf misc/tbfed-pagefooter_index.js node_modules/gitbook-plugin-tbfed-pagefooter/index.js
    fi
    
    gitbook build

    /bin/cp -rf _book $ROOT_PATH/books/${BOOKS[i]}
done
