import { HeaderComponent } from "@/pages/components/Header.comp";
import { SEARCH_KEYWORD } from "@/data/general";

export async function searchKeyword(header: HeaderComponent): Promise<void> {
  await header.search(SEARCH_KEYWORD, "main");
}

