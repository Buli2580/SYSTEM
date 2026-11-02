using System;
namespace SystemWorld {
// Json.NET intentionally permits extensions. This grammar gate accepts JSON only.
internal sealed class StrictJson {
 readonly string source; int index; StrictJson(string text){source=text;}
 static void Fail(){throw new FormatException("Strict JSON required");}
 void Space(){while(index<source.Length&&(source[index]==' '||source[index]=='\r'||source[index]=='\n'||source[index]=='\t'))index++;}
 bool Eat(char c){Space();if(index<source.Length&&source[index]==c){index++;return true;}return false;}
 void Need(char c){if(!Eat(c))Fail();}
 void String(){Need('"');while(index<source.Length){char c=source[index++];if(c=='"')return;if(c<32)Fail();if(c=='\\'){if(index>=source.Length)Fail();char e=source[index++];if(e=='u'){int code=Hex();if(code>=0xD800&&code<=0xDBFF){if(index+2>source.Length||source[index++]!='\\'||source[index++]!='u')Fail();int low=Hex();if(low<0xDC00||low>0xDFFF)Fail();}else if(code>=0xDC00&&code<=0xDFFF)Fail();}else if(e!='"'&&e!='\\'&&e!='/'&&e!='b'&&e!='f'&&e!='n'&&e!='r'&&e!='t')Fail();}}Fail();}
 int Hex(){int start=index;for(int i=0;i<4;i++){if(index>=source.Length||!Uri.IsHexDigit(source[index++]))Fail();}return Convert.ToInt32(source.Substring(start,4),16);}
 void Literal(string word){if(index+word.Length>source.Length||source.Substring(index,word.Length)!=word)Fail();index+=word.Length;}
 bool Digit(){return index<source.Length&&source[index]>='0'&&source[index]<='9';}
 void Number(){if(index<source.Length&&source[index]=='-')index++;if(index>=source.Length)Fail();if(source[index]=='0')index++;else{if(source[index]<'1'||source[index]>'9')Fail();while(Digit())index++;}if(index<source.Length&&source[index]=='.'){index++;if(!Digit())Fail();while(Digit())index++;}if(index<source.Length&&(source[index]=='e'||source[index]=='E')){index++;if(index<source.Length&&(source[index]=='+'||source[index]=='-'))index++;if(!Digit())Fail();while(Digit())index++;}}
 void Value(int depth){if(depth>32)Fail();Space();if(index>=source.Length)Fail();char c=source[index];if(c=='{'){index++;if(Eat('}'))return;do{String();Need(':');Value(depth+1);}while(Eat(','));Need('}');}else if(c=='['){index++;if(Eat(']'))return;do{Value(depth+1);}while(Eat(','));Need(']');}else if(c=='"')String();else if(c=='t')Literal("true");else if(c=='f')Literal("false");else if(c=='n')Literal("null");else Number();}
 internal static void Validate(string raw){var parser=new StrictJson(raw);parser.Value(0);parser.Space();if(parser.index!=raw.Length)Fail();}
}
}
