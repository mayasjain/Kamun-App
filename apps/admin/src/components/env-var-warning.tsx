import { Badge } from "./ui/badge";

export function EnvVarWarning() {
  return (
    <div className="flex items-center">
      <Badge variant={"outline"} className="font-normal">
        Supabase environment variables required
      </Badge>
    </div>
  );
}
