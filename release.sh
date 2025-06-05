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
'Kubernetes-in-Action-Second-Edition'
'LLM_in_Action'
'introduction_to_probability_and_statistics')

cd public
for ((i=0; i <${#BOOKS[@]}; i++))
do
    rm -rf ${BOOKS[i]} && /bin/cp -rf $ROOT_PATH/books/${BOOKS[i]} ${BOOKS[i]}
done

book1="\ \ <url><loc>https://wangwei1237.github.io/digital_video_concepts/</loc><lastmod>2020-06-17T02:55:11.212Z</lastmod></url>"
book2="\ \ <url><loc>https://wangwei1237.github.io/monolith-to-microservices/</loc><lastmod>2020-06-17T02:55:11.212Z</lastmod></url>"

sed -i "4 i ${book1} " sitemap.xml

sed -i "4 i ${book2} " sitemap.xml

cp sitemap.xml bd_sitemap.xml && sed -i "s/github.io/gitee.io/g" bd_sitemap.xml
cp monolith-to-microservices/sitemap.xml m2m_sitemap.xml
cp LLM_in_Action/sitemap.xml llm_sitemap.xml
cp introduction_to_probability_and_statistics/sitemap.xml itpas.xml
cp m2m_sitemap.xml m2m_e_sitemap.xml && sed -i "s/gitee/github/g" m2m_e_sitemap.xml

cd .. 
cp -r docs/* public/shares && cd public/shares && rm -rf GraphQL_in_Action.pdf WebAssembly-in-Action.pdf Digital_Video_and_HD_Algorithms_and_Interfaces_2nd_ed.pdf
cd .. 
