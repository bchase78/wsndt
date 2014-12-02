wsNDT - A websocket client for NDT
============================

This is an experimental client for the Network Diagnostic Tool(NDT) https://code.google.com/p/ndt/

This HTML5 client connects to a websocket proxy on the NDT Server and performs
the client to server and server to client throughput tests. The meta test is
also performed.

This client is a proof of concept. Due to the nature of the websocket proxy, 
there are no real end to end measurements possible. Because of this some of 
the results are skewed, especially the round trip time is false. This in turn
results in a misinterpretation of many of the other parameters. This problem 
could be overcome, if the NDT server had native support for websockets. This
would eliminate the need for a proxy. Websockify ( https://github.com/kanaka/websockify )
is used for the proxy.


To use the client, only the installation of a websocket proxy on the NDT server
is required. The client must then be served from the local ndt server.

There is a demo available at: http://ndt.fh-luebeck.de/wsndt

How to get wsNDT up and running
----------------------------

Get a working NDT Server

Install websockify from EPEL 
	
	yum install python-websockify

Add user for running websockify 
	
	useradd -d /var/empty/websockify -m -r -s /sbin/nologin -c "Websockify user daemon" websockify 

copy init script to path 
	
	cp websockify /etc/init.d/websockify

Set websockify to start on boot

	chkconfig --add websockify

Start service

	service websockify start
	
Open up ports 3011-3013 in the firewall in file /etc/sysconfig/iptables
	
	-A INPUT -m state --state NEW -p tcp --dport 3011 -j ACCEPT
	-A INPUT -m state --state NEW -p tcp --dport 3012 -j ACCEPT
	-A INPUT -m state --state NEW -p tcp --dport 3013 -j ACCEPT

Publish the client to the webserver

Now the client should be working. Enjoy.


