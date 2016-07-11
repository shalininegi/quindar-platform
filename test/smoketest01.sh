#!/bin/bash
# Program: smoketest01.sh
# Purpose: automated test using curl
# Author:  Ray Lai
# Updated: Jul 11, 2016
#
SERVERENDPOINT='http://platform.audacy.space:7902'
NOW=$(date +"%Y-%m-%d")
TESTOKRESULT="automatedTest-log-$NOW.log"
TESTERR="automatedTest-err-$NOW.log"

# clean up files, reset test reports
if [ -f $TESTOKRESULT ]; 
then
  rm $TESTOKRESULT
fi

if [ -f $TESTERR ];
then
  rm $TESTERR
fi

# write header
echo "Empty database first in order to have a clean slate"
echo "Audacy Quindar platform automated test - " $NOW  >> $TESTOKRESULT
echo "-------------------------------------------------" >> $TESTOKRESULT
echo "Audacy Quindar platform automated test - " $NOW >> $TESTERR
echo "-------------------------------------------------" >> $TESTERR

echo
echo "Checking if read is successful"

# syntax: isReadOK UrlEndpoint description
isReadOK() {
  X=`curl -X GET $1 | grep status | sed -e 's/[{}]/''/g' | awk -v k="text" '{n=split($0,a,","); print a[1]}' | awk -v k="text" '{n=split($0,a,":"); print a[2]}'`
  if [ $X = "200" ];
then
  echo $1 " - " $2 " OK "  `date`
  echo $1 " - " $2 " OK " `date` >> $TESTOKRESULT
else
  echo $1 " - " $2 " error " `date`
  echo $1 " - " $2 " error " `date`  >> $TESTERR
fi
}

# syntax: isWriteOK UrlEndpoint 
isWriteOK() {
Y=`curl -X POST -H "Content-type: application/json" $1 | grep status | sed -e 's/[{}]/''/g' | awk -v k="text" '{n=split($0,a,","); print a[1]}' | awk -v k="text" '{n=split($0,a,":"); print a[2]}'`
if [ $Y = "200" ];
then
  echo $1 " - " $3 " OK "  `date`
  echo $1 " - " $3 " OK " `date` >> $TESTOKRESULT
else
  echo $1 " - " $3 " error " `date`
  echo $1 " - " $3 " error " `date`  >> $TESTERR
fi
}

# POST attitude
postAttitudeOK() {
Y1=`curl -X POST -H "Content-type: application/json" -d '{"vehicleId":"CST-100 Starliner","q1":0.237929,"q2":0.666632,"q3":0.331804,"q4":0.580101}' $1 | grep status | sed -e 's/[{}]/''/g' | awk -v k="text" '{n=split($0,a,","); print a[1]}' | awk -v k="text" '{n=split($0,a,":"); print a[2]}'`
if [ $Y1 = "200" ];
then
  echo $1 " - " $2 " OK "  `date`
  echo $1 " - " $2 " OK " `date` >> $TESTOKRESULT
else
  echo $1 " - " $2 " error " `date`
  echo $1 " - " $2 " error " `date`  >> $TESTERR
fi
}

# POST position
postPositionOK() {
Y2=`curl -X POST -H "Content-type: application/json" -d '{"vehicleId":"XCOR Lynx","vz":-0.936569,"vy":-16.533345,"vx":-6.477931,"z":87167.3526,"y":-370782.1986,"x":345693.001}' $1 | grep status | sed -e 's/[{}]/''/g' | awk -v k="text" '{n=split($0,a,","); print a[1]}' | awk -v k="text" '{n=split($0,a,":"); print a[2]}'`

if [ $Y2 = "200" ];
then
  echo $1 " - " $2 " OK "  `date`
  echo $1 " - " $2 " OK " `date` >> $TESTOKRESULT
else
  echo $1 " - " $2 " error " `date`
  echo $1 " - " $2 " error " `date`  >> $TESTERR
fi
}

# POST vehicle
postVehicleOK() {
Y3=`curl -X POST -H "Content-type: application/json" -d '{"deviceId":"Battery-sIQ","calibrationFactor":"-0.5146501450155723","warnLow":-404.16251414750116,"warnHigh":48.34560267826693,"alertLow":271.53661524505407,"alertHigh":545.3523380183927,"uom":"Kevin","value":229.7520535794023,"vehicleId":"Orion MPCV"}' $1 | grep status | sed -e 's/[{}]/''/g' | awk -v k="text" '{n=split($0,a,","); print a[1]}' | awk -v k="text" '{n=split($0,a,":"); print a[2]}'`

if [ $Y3 = "200" ];
then
  echo $1 " - " $2 " OK "  `date`
  echo $1 " - " $2 " OK " `date` >> $TESTOKRESULT
else
  echo $1 " - " $2 " error " `date`
  echo $1 " - " $2 " error " `date`  >> $TESTERR
fi 
}

# POST orbit
postOrbitOK() {

Y4=`curl -X POST -H "Content-type: application/json" -d '{"vehicleId":"IBEX","createdAt":"2016-07-09T06:05:00.023Z","trajectory":[[0.7711128056747839,1.2111149041137503],[1.8608938163612039,2.9210299598667313],[2.944023465225473,4.616325865486016],[3.652904807217419,5.722433233638541],[4.193262040801346,6.56326568323619],[4.977457220456563,7.779293423266543],[6.465782885462977,10.070419680296965],[7.335254910122603,11.39670259075564],[7.737686268659308,12.007086922246328],[7.780145009979606,12.07134976949507],[9.00105519958306,13.907341117066544],[9.4189849430928,14.530183579802046],[9.885996810393408,15.22250882803771],[11.135199233912862,17.054014710283234],[11.517457622243091,17.608139939398985],[11.563718974241056,17.67499011250183],[11.65281089702621,17.80360278886692],[13.39257030065637,20.27907168634598],[15.24657258274965,22.8345873527473],[17.110349428630435,25.307196072761656],[17.29510698579252,25.546641587228248],[17.89934715856798,26.32226363711576],[19.182184496265837,27.929713417665322],[19.33291152655147,28.114965818746374],[19.413687120517714,28.213923808345758],[20.068877619178963,29.00823917845633],[20.13531764980871,29.08794685043663],[20.977905401773747,30.08507666456628],[21.362322059902358,30.53140692080178],[22.205530626955436,31.491056709529705],[23.15453745394479,32.53844536417828],[25.13890449397731,34.61184443673012],[25.6235675222706,35.09339328565128],[26.440397945907893,35.882176672807866],[26.534068043879227,35.97077803644285],[27.103143488988273,36.50076002765826],[28.776287969038815,37.97478581681794],[30.833539464627385,39.609216273066046],[32.80621265240479,40.98479518088964],[34.8193755639717,42.1882886925019],[36.27712568948045,42.93005629632549],[38.039655959606165,43.678335506883776],[39.44583349393214,44.15690940787357],[39.750084276590485,44.24649496477297],[40.03403040263801,44.325599950681195],[41.803164005093265,44.72011009091869],[42.2015650457004,44.78547282703372],[43.77358804200775,44.95877091758105],[45.80305559409316,44.982320905010795],[46.64427294554188,44.92589869797643],[47.925756780640214,44.765525201139674],[49.07643776219337,44.54519423276067],[50.29915716520044,44.23233422979158],[50.35335098265204,44.21659824651538],[51.1540654489072,43.96568999648421],[52.42430204183328,43.49728556073765],[54.47588402084074,42.56065376698236],[54.87712177478242,42.35179433584393],[56.96829756479709,41.12977511740139],[57.22146160658448,40.966826738607715],[58.67066797961014,39.97287492088158],[59.569226454943404,39.30505344324386],[61.07424378974827,38.10023606384805],[62.67956030608619,36.699340216614175],[64.68899075826629,34.78398480967771],[65.64966411530038,33.80723422647295],[66.15354382323565,33.27965261142858],[66.2571290907217,33.169913633959226],[66.76284948051905,32.62794972108237],[68.63973496553952,30.52903315229006],[69.55063770108389,29.46257947267919],[71.5823380527552,26.978271757009722],[72.78373006985055,25.444598269437044],[74.70312828884923,22.9026339679676],[75.39336161401586,21.96278651238376],[75.91706108218057,21.24116217064515],[76.56949498348402,20.33224800480137],[77.4718692881055,19.05786018632598],[78.20918351276775,18.00248661493242],[78.75832551026248,17.208671527638913],[80.35204764567312,14.87011196035032],[80.855345878005,14.121687675739723],[81.23370866919865,13.556164750922072],[81.99006199087013,12.418686125651647],[83.27468472060279,10.467334157137113],[84.32088772105051,8.862414909939467],[85.22283697852397,7.469221333081781],[86.95781551019752,4.769675968273343],[89.0516324416734,1.4894202014531326],[89.324440607056,1.0610678657934873],[90.03117730172815,-0.048973181366768676],[91.53979943059383,-2.417546860387651],[92.69961237837559,-4.234267926528815],[92.7417487870436,-4.300157379444722],[94.11584702276159,-6.442938984050209],[95.22549070832319,-8.162741216325621],[95.58422297493088,-8.716233966350062],[95.72833903362043,-8.938212582245786],[96.239693811303,-9.723976816055709],[96.9106158152921,-10.750198793285701],[97.2675920485286,-11.29385138862763],[99.11511256697122,-14.07762053933069],[99.39428552193567,-14.49345860700487],[99.50421959003434,-14.656833798926055],[100.94134097390342,-16.771829422992788],[102.39115050232503,-18.862724014261957],[104.09255200154148,-21.254473077113193],[105.66189804512541,-23.394327345469712],[105.7193541183602,-23.471377200863245],[106.74526738820131,-24.8309649186154],[106.99796058586799,-25.161024767054368],[107.88794942840468,-26.307740424214817],[108.10626276165712,-26.585192898392183],[109.11779457633384,-27.850338422108837],[110.40786527853925,-29.4132785563842],[111.0406881876057,-30.158343408129223],[111.37484547009225,-30.545855302755243],[113.4584741101833,-32.866396136624935],[114.4234418517677,-33.882914072237774],[114.6653449819656,-34.13175831044726],[116.71675098403357,-36.14246830485901],[118.1463577899849,-37.434760833954],[118.76058839107864,-37.96154894673898],[120.04190605354961,-39.00401440130974],[121.86368583550211,-40.35140975731717],[122.56910595118534,-40.82960750545748],[123.9163768199971,-41.67388932962615],[124.63718493168709,-42.08786177597818],[125.97082034191118,-42.7833571486081],[126.27712286268363,-42.93005496510508],[127.81669258933982,-43.592755663758254],[128.3666085026227,-43.79904358489191],[129.3469083597418,-44.12670779709278],[130.228264166601,-44.37720414597843],[130.6337676431751,-44.47836095898128],[131.5429042442469,-44.67273997281668],[132.31614537183196,-44.802667981705824],[134.2953782961937,-44.98638908309193],[134.69273373810577,-44.99741165099342],[136.15704226049132,-44.96330248545795],[136.21244605239485,-44.95970443344641],[138.03388143123598,-44.74789090220272],[138.34685463153298,-44.69325539883972],[138.96903701627167,-44.56880596261097],[140.42353589849085,-44.19598385954625],[142.2512756514829,-43.56614206520934],[143.36462756141557,-43.095403990150295],[143.66642341266854,-42.956557289500616],[144.06130071787632,-42.76768973901789],[144.67786537159702,-42.45655584516288],[145.84978781393733,-41.81108895488211],[147.155784977763,-41.00940717246225],[147.27124818456363,-40.93440488931032],[148.14050092892725,-40.348498261612704],[148.3210082874401,-40.222153906186065],[150.08946661863015,-38.900686324570195],[150.92682223918388,-38.22295257829089],[151.52955913201447,-37.7148671325856],[153.13799629118301,-36.27793215168041],[154.2403192628176,-35.22683129533642],[154.66027094719476,-34.81258850767142],[155.79252203635417,-33.65871164077778],[155.7979376822711,-33.653064761663316],[157.14810593703308,-32.20825086245973],[157.17324499082764,-32.180661078162466],[158.99563302835463,-30.11597462964121],[159.83259355742499,-29.12638756334995],[161.9172201505398,-26.555422491516158],[162.03056916783115,-26.411473975287027],[162.78296166914532,-25.44559378566654],[164.33223109047412,-23.40220462513175],[165.76115509101675,-21.456743620373366],[166.7046400944006,-20.142641517240055],[167.60052587816045,-18.87459383959678],[169.31371105995515,-16.399401003169995],[171.24028672631852,-13.546311607151708],[171.28586290054977,-13.478024353722127],[172.26719717714028,-11.999693955765048],[173.17535970620835,-10.619010807778565],[173.57473846585515,-10.008373145251245],[175.44222401380563,-7.1291735207365114],[176.56729833865563,-5.379181395533679],[177.75640655693158,-3.52062684554718],[178.65059924374825,-2.1188500365410965],[179.21096254540632,-1.239260438720019],[179.3580782791602,-1.0082439052372374],[179.63281655139312,-0.5767546206246402],[180.86859874033857,1.3641826748353048],[182.72343144160718,4.271515354703715],[184.76990910952466,7.457984731298536],[185.8707492385993,9.157341535124237],[187.13502030314433,11.092153062748686],[188.33112885113826,12.902828114859412],[189.2116928067526,14.22163350167503],[189.93297466884854,15.291930622711579],[191.40435862476028,17.444512735401926],[193.2301959407518,20.051057047894545],[193.861353896023,20.933681107024306],[195.80027048555223,23.57972764739349],[197.4794188228205,25.784450743896258]]}' $1 | grep status | sed -e 's/[{}]/''/g' | awk -v k="text" '{n=split($0,a,","); print a[1]}' | awk -v k="text" '{n=split($0,a,":"); print a[2]}'`
if [ $Y4 = "200" ];
then
  echo $1 " - " $2 " OK "  `date`
  echo $1 " - " $2 " OK " `date` >> $TESTOKRESULT
else
  echo $1 " - " $2 " error " `date`
  echo $1 " - " $2 " error " `date`  >> $TESTERR
fi 
}

# syntax: testCase description
testCase() {
  echo
  echo $1 >> $TESTOKRESULT
  echo $1 >> $TESTERR
  echo $1
  echo "--------------" >> $TESTOKRESULT
  echo "--------------" >> $TESTERR
  echo "--------------"
}

# basic read to see if database access is available
testCase "Test 1 - checking if database access is available"
isReadOK $SERVERENDPOINT/services/v1/attitude " read "
isReadOK $SERVERENDPOINT/services/v1/position " read "
isReadOK $SERVERENDPOINT/services/v1/vehicle " read "
isReadOK $SERVERENDPOINT/services/v1/orbit " read "

# clean up database
testCase "Test 2 - zap database collections "
isWriteOK $SERVERENDPOINT/services/v1/admin/cleanup/attitude " cleanup "
isWriteOK $SERVERENDPOINT/services/v1/admin/cleanup/position " cleanup "
isWriteOK $SERVERENDPOINT/services/v1/admin/cleanup/vehicle " cleanup "
isWriteOK $SERVERENDPOINT/services/v1/admin/cleanup/orbit " cleanup "

testCase "Test 3 - database collection should be empty now "
postAttitudeOK $SERVERENDPOINT/services/v1/attitude " empty "
postPositionOK $SERVERENDPOINT/services/v1/position " empty "
postVehicleOK $SERVERENDPOINT/services/v1/vehicle " empty "
postOrbitOK $SERVERENDPOINT/services/v1/orbit " empty "

testCase "Checking if data collection is empty after insert"
isReadOK $SERVERENDPOINT/services/v1/attitude " read "
isReadOK $SERVERENDPOINT/services/v1/position " read "
isReadOK $SERVERENDPOINT/services/v1/vehicle " read "
isReadOK $SERVERENDPOINT/services/v1/orbit " read "

# generate seed data
isWriteOK $SERVERENDPOINT/services/v1/simulation/attitude/1000 " generate 1000 attitude rows "
isWriteOK $SERVERENDPOINT/services/v1/simulation/position/1000 " generate 1000 position rows "
isWriteOK $SERVERENDPOINT/services/v1/simulation/vehicle/1000 " generate 1000 vehicle rows "
isWriteOK $SERVERENDPOINT/services/v1/simulation/orbit/1000 " generate 1000 orbit rows "

# read 1000 back
testCase "Checking if data collection is empty after insert"
isReadOK $SERVERENDPOINT/services/v1/attitude/CST-100%20Starliner/1000 " read "
isReadOK $SERVERENDPOINT/services/v1/position/XCOR%20Lynx/1000 " read "
isReadOK $SERVERENDPOINT/services/v1/vehicle/Orion%20MPCV/1000 " read "
isReadOK $SERVERENDPOINT/services/v1/orbit/IBEX/1000 " read "

# read by vehicle and time period
#testCase "Read by vehicleId and time period from/to "
#isReadOK $SERVERENDPOINT/services/v1/attitude/CST-100%20Starliner/1468276662/1468276662 " read "
#isReadOK $SERVERENDPOINT/services/v1/position/XCOR%20Lynx/1468276669/1468276669 " read "
#isReadOK $SERVERENDPOINT/services/v1/vehicle/Orion%20MPCV/1468276670/1468276669 " read "
#isReadOK $SERVERENDPOINT/services/v1/orbit/IBEX/1468277766/1468277765 " read "

# metrics by vehicle by time period
#testCase "Metrics by vehicle by time period "
#isReadOK $SERVERENDPOINT/services/v1/admin/metrics/attitude/total/CST-100%20Starliner/1468276662/1468276662 " attitude metrics by vehicle and time period "
#isReadOK $SERVERENDPOINT/services/v1/admin/metrics/position/total/XCOR%20Lynx/1468276669/1468276669 " position metrics by vehicle and time period "
#isReadOK $SERVERENDPOINT/services/v1/admin/metrics/vehicle/total/Orion%20MPCV/1468276670/1468276669  " vehicle metrics by vehicle and time period "
#isReadOK $SERVERENDPOINT/services/v1/admin/metrics/orbit/total/IBEX/1468277766/1468277765 " orbit metrics by vehicle and time period "

# test metrics
testCase "Test 4 - test metrics showing total - all"
isReadOK $SERVERENDPOINT/services/v1/admin/metrics/attitude/total/all " attitude metrics "
isReadOK $SERVERENDPOINT/services/v1/admin/metrics/position/total/all " position metrics "
isReadOK $SERVERENDPOINT/services/v1/admin/metrics/vehicle/total/all " vehicle metrics "
isReadOK $SERVERENDPOINT/services/v1/admin/metrics/orbit/total/all " orbit metrics "

testCase "Test 4 - test metrics showing total - by vehicle"
isReadOK $SERVERENDPOINT/services/v1/admin/metrics/attitude/total/CST-100%20Starliner " attitude metrics by vehicle "
isReadOK $SERVERENDPOINT/services/v1/admin/metrics/position/total/XCOR%20Lynx " position metrics by vehicle "
isReadOK $SERVERENDPOINT/services/v1/admin/metrics/vehicle/total/Orion%20MPCV " vehicle metrics by vehicle "
isReadOK $SERVERENDPOINT/services/v1/admin/metrics/orbit/total/IBEX " orbit metrics by vehicleby "

# test trending
testCase "Test 4 - test trending - all"
isReadOK $SERVERENDPOINT/services/v1/admin/metrics/trend/attitude/all " attitude trending "
isReadOK $SERVERENDPOINT/services/v1/admin/metrics/trend/position/all " position trending "
isReadOK $SERVERENDPOINT/services/v1/admin/metrics/trend/vehicle/all " vehicle trending "
isReadOK $SERVERENDPOINT/services/v1/admin/metrics/trend/orbit/all " orbit trending "

# test trending with nLimit
testCase "Test trending - nLimit"
isReadOK $SERVERENDPOINT/services/v1/admin/metrics/trend/attitude/10 " attitude trending nLimit "
isReadOK $SERVERENDPOINT/services/v1/admin/metrics/trend/position/10 " position trending nLimit  "
isReadOK $SERVERENDPOINT/services/v1/admin/metrics/trend/vehicle/10 " vehicle trending nLimit "
isReadOK $SERVERENDPOINT/services/v1/admin/metrics/trend/orbit/10 " orbit trending by nLimit "

# test trending by vehicle
testCase "Test trending by vehicle"
isReadOK $SERVERENDPOINT/services/v1/admin/metrics/trend/attitude/by/CST-100%20Starliner " attitude trending by vehicle "
isReadOK $SERVERENDPOINT/services/v1/admin/metrics/trend/position/by/XCOR%20Lynx " position trending by vehicle  "
isReadOK $SERVERENDPOINT/services/v1/admin/metrics/trend/vehicle/by/Orion%20MPCV " vehicle trending by vehicle "
isReadOK $SERVERENDPOINT/services/v1/admin/metrics/trend/orbit/by/IBEX " orbit trending by vehicle "

# test trending by vehicle with nLimit
testCase "Test trending by vehicle with nLimit"
isReadOK $SERVERENDPOINT/services/v1/admin/metrics/trend/attitude/CST-100%20Starliner/5 " attitude trending by vehicle "
isReadOK $SERVERENDPOINT/services/v1/admin/metrics/trend/position/XCOR%20Lynx/5 " position trending by vehicle  "
isReadOK $SERVERENDPOINT/services/v1/admin/metrics/trend/vehicle/Orion%20MPCV/5 " vehicle trending by vehicle "
isReadOK $SERVERENDPOINT/services/v1/admin/metrics/trend/orbit/IBEX/5 " orbit trending by vehicle "

# housekeeping: reset and clean up database
testCase "Test 5 - zap database collections "
isWriteOK $SERVERENDPOINT/services/v1/admin/cleanup/attitude " reset db "
isWriteOK $SERVERENDPOINT/services/v1/admin/cleanup/position " reset db "
isWriteOK $SERVERENDPOINT/services/v1/admin/cleanup/vehicle " reset db "
isWriteOK $SERVERENDPOINT/services/v1/admin/cleanup/orbit " reset db "

# add 1 single record
testCase "Test 6 - insert 1 record per collection 
postAttitudeOK $SERVERENDPOINT/services/v1/attitude " insert 1 attitude data point "
postPositionOK $SERVERENDPOINT/services/v1/position " insert 1 position data point  "
postVehicleOK $SERVERENDPOINT/services/v1/vehicle " insert 1 vehicle data point  "
postOrbitOK $SERVERENDPOINT/services/v1/orbit " insert 1 orbit data point  "

# 
