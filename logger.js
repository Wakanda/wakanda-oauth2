
exports.log= function(data) {
     var fout = TextStream("c:/t.txt", "write");
     var date = new Date();
     var raw = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
     raw += "  " + (date.getHours() + 1) + ":" + (date.getMinutes() + 1) + ":" + (date.getSeconds() + 1);
     raw += " " + data + "\n";
     fout.write(raw);
     fout.close();
 }